import { Button } from "../common/Button";
import { IconCard } from "../common/IconCard";
import { DocumentCheck } from "../icon/DocumentCheck";
import { DocumentAccount } from "../icon/DocumentAccount";
import { DocumentReplace } from "../icon/DocumentReplace";

export const GuideContainer = ({ handleStartRegister }) => {
    return (
        <div className="max-w-[821px] w-full mx-auto">
            <IconCard
                h="Q. 수취 정보가 무엇인가요?"
                infoTitle="수취인(협업 파트너)에게
      샌드박스가 정산금을 지급하기 위한 필수 정보입니다."
                infoLi={[
                    "입력하신 수취 정보의 확인 후 정산금 지급 및 세무처리 절차가 가능해집니다.",
                ]}
                desc={[""]}
                icon={DocumentCheck}
            />
            <IconCard
                h="Q. 어떤 정보를 입력해야 하나요?"
                infoTitle="입력하신 수취 정보의 확인 후 정산금 지급 및 세무처리 절차가 가능해집니다."
                infoLi={[
                    "입력하신 수취 정보의 확인 후 정산금 지급 및 세무처리 절차가 가능해집니다.",
                ]}
                desc={[
                    "※ 실제 데이터 저장 시 개인정보 및 계좌 정보는 암호화되어 안전하게 보호됩니다.",
                ]}
                icon={DocumentAccount}
            />
            <IconCard
                h="Q. 수취 정보를 변경할 수 있나요?"
                infoTitle="등록된 수취 정보는 로그인 계정에 저장되며, 언제든 수정할 수 있습니다."
                infoLi={[
                    "사업자 유형 / 지급 계좌등 수취 정보 변경시 증빙 서류를 함께 제출해주시면 검토 절차를 통해 변경됩니다.",
                ]}
                desc={[
                    "※ 반영 전 정보로 정산이 완료된 경우 세무 처리에 어려움이 생길 수 있습니다.",
                    <span key="privacy-desc">
                        ※ 변경 전 정보는{" "}
                        <a
                            href="/legal/privacy" /* 실제 URL 입력 */
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline hover:text-gray-900 transition-colors cursor-pointer"
                        >
                            개인정보처리방침
                        </a>
                        에 따라 파기되며, 수정한 정보는 암호화되어 안전하게 보호됩니다.
                    </span>,
                ]}
                icon={DocumentReplace}
            />

            <Button
                type="button"
                onClick={handleStartRegister}
                variant="primary"
                size="lg"
                className="w-full"
            >
                등록 시작하기
            </Button>
        </div>
    );
};
