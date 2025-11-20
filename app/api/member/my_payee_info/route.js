import dbConnect from '@/lib/dbConnect';
import { TABLE_NAMES } from '@/constants/dbConstants';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// 파일 정보 테이블의 type 필드에 사용된 상수 (POST와 동일해야 함)
const FILE_TYPE_TAG = 'PAYEE_DOCUMENT';

/**
 * GET 요청 처리 함수
 * 현재 로그인된 회원의 수취인 정보를 DB에서 조회합니다.
 * @param {Request} req Next.js Request 객체
 */
export async function GET(req) {
    let connection;

    try {
        // *******************************************************************
        // 🚨 0. 세션(쿠키)에서 실제 member_idx 가져오기 (POST 로직과 동일)
        // *******************************************************************
        const cookieStore = await cookies();
        const memberIdxCookie = cookieStore.get('member_idx');

        if (!memberIdxCookie || !memberIdxCookie.value) {
            return NextResponse.json(
                { message: '인증 정보가 없습니다. 다시 로그인해 주세요.' },
                { status: 401 }
            );
        }

        const member_idx = parseInt(memberIdxCookie.value, 10);
        if (isNaN(member_idx) || member_idx <= 0) {
            return NextResponse.json(
                { message: '유효하지 않은 사용자 ID입니다.' },
                { status: 401 }
            );
        }
        // *******************************************************************

        // 1. 데이터베이스 연결
        connection = await dbConnect();

        // 2. 수취인 정보 (SBN_MEMBER_PAYEE) 조회
        const [payeeRows] = await connection.query(
            `SELECT * FROM ${TABLE_NAMES.SBN_MEMBER_PAYEE} WHERE member_idx = ? ORDER BY created_at DESC LIMIT 1`,
            [member_idx]
        );

        // 등록된 수취인 정보가 없는 경우 처리
        if (payeeRows.length === 0) {
            return NextResponse.json({
                payeeData: null,
                message: '등록된 수취인 정보가 없습니다.'
            }, { status: 200 });
        }

        const payeeDataRow = payeeRows[0];
        const payee_idx = payeeDataRow.idx; // 파일 조회를 위해 payee_idx 저장

        // 3. 파일 정보 (SBN_FILE_INFO) 조회
        const [fileRows] = await connection.query(
            `SELECT file_url, tag, file_realname, file_ext FROM ${TABLE_NAMES.SBN_FILE_INFO} WHERE ref_table_name = ? AND ref_table_idx = ? AND type = ?`,
            [TABLE_NAMES.SBN_MEMBER_PAYEE, payee_idx, FILE_TYPE_TAG]
        );

        // 4. 클라이언트 구조 (PayeeData)에 맞게 데이터 재구성

        // 4-1. 파일 정보 매핑 (tag 기준)
        const filesMap = fileRows.reduce((acc, file) => {
            // tag는 클라이언트의 필드 이름(e.g., business_document)과 일치해야 함
            acc[file.tag] = {
                url: file.file_url,
                name: file.file_realname,
            };
            return acc;
        }, {});

        // 4-2. RecipientInfo 재구성
        const isIndividual = payeeDataRow.biz_type === 'individual';
        const isForeigner = payeeDataRow.is_foreigner === 'Y';
        const isMinor = payeeDataRow.is_minor === 'Y';

        const recipientInfo = {
            businessType: payeeDataRow.biz_type,
            isOverseas: payeeDataRow.is_overseas === 'Y',
            isMinor: isMinor,
            isForeigner: isForeigner,

            // 개인, 외국인, 미성년자 필드 매핑
            realName: isIndividual && !isForeigner ? payeeDataRow.user_name : null,
            idNumber: isIndividual && !isForeigner ? payeeDataRow.ssn : null,
            idDocumentType: payeeDataRow.identification_type,
            idDocument: filesMap.id_document || null,

            foreignerName: isIndividual && isForeigner ? payeeDataRow.user_name : null,
            foreignerRegistrationNumber: isIndividual && isForeigner ? payeeDataRow.ssn : null,
            foreignerRegistrationCard: filesMap.foreigner_registration_card || null,

            // 사업자/법인 필드 매핑
            businessName: payeeDataRow.corp_name || payeeDataRow.biz_name || null,
            businessNumber: payeeDataRow.corp_reg_no || payeeDataRow.biz_reg_no || null,
            businessDocument: filesMap.business_document || null,

            // 미성년자 필드 매핑
            guardianName: isMinor ? payeeDataRow.guardian_name : null,
            guardianPhone: isMinor ? payeeDataRow.guardian_tel : null,
            familyRelationCertificate: filesMap.family_relation_certificate || null,

            // idDocumentUrl: null,
            // foreignerRegistrationCardUrl: null,
            // businessDocumentUrl: null,
            // familyRelationCertificateUrl: null,
        };

        // 4-3. AccountInfo 재구성
        const accountInfo = {
            bankName: payeeDataRow.bank_name,
            accountHolder: payeeDataRow.account_holder,
            accountNumber: payeeDataRow.account_number,
            swiftCode: payeeDataRow.swift_code,
            bankAddress: payeeDataRow.bank_address,
            bankDocument: filesMap.bank_document || null,

            // bankDocumentUrl: null,
        };

        // 4-4. TaxInfo 재구성
        // 🚨 DB에 없는 필드는 클라이언트 구조를 맞추기 위해 임시 값/null 처리
        const taxInfo = {
            isSimpleTax: payeeDataRow.is_simple_taxpayer === 'Y',
            issueType: payeeDataRow.invoice_type, // 'individual' | 'business' 등

            // ⚠️ 임시 값/null 처리 필드 (DB 구조에 추가되어야 함)
            incomeType: payeeDataRow.income_type || 'business', // income_type 컬럼이 없다고 가정
            issueTaxInvoice: payeeDataRow.issue_tax_invoice === 'Y', // issue_tax_invoice 컬럼이 없다고 가정
            withholding: payeeDataRow.withholding === 'Y', // withholding 컬럼이 없다고 가정
            managerName: payeeDataRow.manager_name || null,
            managerPhone: payeeDataRow.manager_tel || null,
            managerEmail: payeeDataRow.manager_email || null,
        };

        // 4-5. 메타데이터 재구성
        const metadata = {
            lastModified: payeeDataRow.updated_at
                ? new Date(payeeDataRow.updated_at).toISOString()
                : new Date(payeeDataRow.created_at).toISOString(),

            // ⚠️ 동의/만료 필드는 현재 DB 구조에 없으므로 임시 값 사용
            consentType: '30days', // 예시
            validityPeriodEnd: new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        };

        // 5. 최종 응답 구조 반환
        return NextResponse.json({
            payeeData: {
                recipientInfo,
                accountInfo,
                taxInfo
            },
            metadata: metadata
        }, { status: 200 });

    } catch (error) {
        console.error('Error in GET /api/member/payee_info:', error);

        return NextResponse.json(
            { message: '서버 오류로 수취인 정보를 불러올 수 없습니다.', error: error.message },
            { status: 500 }
        );
    } finally {
        if (connection) {
            connection.release();
        }
    }
}