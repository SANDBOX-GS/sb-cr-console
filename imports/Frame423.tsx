function Frame67() {
  return (
    <div className="bg-[#e40d4e] content-stretch flex flex-col gap-2.5 items-center justify-center relative rounded-[100px] shrink-0 size-5">
      <div className="font-['Pretendard:Medium',_sans-serif] leading-[0] not-italic relative shrink-0 text-[#ffffff] text-[14px] text-nowrap">
        <p className="leading-[19px] whitespace-pre">1</p>
      </div>
    </div>
  );
}

function Frame68() {
  return (
    <div className="content-stretch flex gap-2.5 items-start justify-start relative shrink-0 w-full">
      <Frame67 />
      <div className="basis-0 font-['Pretendard:Medium',_sans-serif] grow leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#111212] text-[16px]">
        <p className="leading-[21px]">로그인 계정 안내</p>
      </div>
    </div>
  );
}

function Frame72() {
  return (
    <div className="relative shrink-0 w-full">
      <div className="flex flex-row items-center justify-center relative size-full">
        <div className="box-border content-stretch flex gap-2.5 items-center justify-center pl-6 pr-0 py-0 relative w-full">
          <div className="basis-0 font-['Pretendard:Regular',_sans-serif] grow leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#111212] text-[14px]">
            <ul className="css-ed5n1g list-disc">
              <li className="mb-0 ms-[21px]">
                <span className="leading-[19px]">접속 링크의 파라미터를 복호화하여 고유한 유저 판별</span>
              </li>
              <li className="ms-[21px]">
                <span className="leading-[19px]">파라미터로 판별한 user의 email 컬럼 값과 입력 이메일이 동일해야 validation 통과</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame70() {
  return (
    <div className="content-stretch flex flex-col gap-2 items-start justify-start relative shrink-0 w-full">
      <Frame68 />
      <Frame72 />
    </div>
  );
}

function Description() {
  return (
    <div className="absolute bg-[#ffffff] box-border content-stretch flex flex-col gap-5 items-start justify-start left-[54px] px-6 py-8 rounded-[8px] top-[94px] w-[480px]" data-name="description">
      <Frame70 />
    </div>
  );
}

function Frame69() {
  return (
    <div className="bg-[#e40d4e] content-stretch flex flex-col gap-2.5 items-center justify-center relative rounded-[100px] shrink-0 size-5">
      <div className="font-['Pretendard:Medium',_sans-serif] leading-[0] not-italic relative shrink-0 text-[#ffffff] text-[14px] text-nowrap">
        <p className="leading-[19px] whitespace-pre">2</p>
      </div>
    </div>
  );
}

function Frame73() {
  return (
    <div className="content-stretch flex gap-2.5 items-start justify-start relative shrink-0 w-full">
      <Frame69 />
      <div className="basis-0 font-['Pretendard:Medium',_sans-serif] grow leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#111212] text-[16px]">
        <p className="leading-[21px]">비밀번호</p>
      </div>
    </div>
  );
}

function Frame74() {
  return (
    <div className="relative shrink-0 w-full">
      <div className="flex flex-row items-center justify-center relative size-full">
        <div className="box-border content-stretch flex gap-2.5 items-center justify-center pl-6 pr-0 py-0 relative w-full">
          <div className="basis-0 font-['Pretendard:Regular',_sans-serif] grow leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#111212] text-[14px]">
            <ul className="css-ed5n1g">
              <li className="list-disc mb-0 ms-[21px]">
                <span className="leading-[19px]">비밀번호 마스킹 해제 기능</span>
              </li>
              <ul className="css-ed5n1g mb-0">
                <li className="list-disc ms-[42px]">
                  <span className="leading-[19px]">default : 마스킹 처리된 상태로 노출, 아이콘 클릭 시 마스킹 해제 입력 원본 확인 가능 (가린 눈 : 마스킹 / 눈 : 입력 원본 데이터)</span>
                </li>
              </ul>
              <li className="list-disc mb-0 ms-[21px]">
                <span className="leading-[19px]">비밀번호 정책 : 대소문자, 숫자, 특수문자 3가지 type 포함 필수 8~16자리</span>
              </li>
              <ul className="css-ed5n1g mb-0">
                <li className="list-disc mb-0 ms-[42px]">
                  <span className="leading-[19px]">3가지 타입이 섞여있는지</span>
                </li>
                <ul className="css-ed5n1g mb-0">
                  <li className="list-disc ms-[63px]">
                    <span className="leading-[19px]">error message: 대소문자, 숫자, 특수문자가 포함되어야 합니다.</span>
                  </li>
                </ul>
                <li className="list-disc mb-0 ms-[42px]">
                  <span className="leading-[19px]">글자수가 8자 이상 16자 이하 인지</span>
                </li>
                <ul className="css-ed5n1g">
                  <li className="list-disc ms-[63px]">
                    <span className="leading-[19px]">error message: 8~16자 이내로 입력해 주세요.</span>
                  </li>
                </ul>
              </ul>
              <li className="list-disc mb-0 ms-[21px]">
                <span className="leading-[19px]">비밀번호 확인 인풋 : 비밀번호 인풋과 동일한 값으로만 인정</span>
              </li>
              <ul className="css-ed5n1g">
                <li className="list-disc ms-[42px]">
                  <span className="leading-[19px]">error message : 비밀번호와 일치하지 않습니다.</span>
                </li>
              </ul>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame71() {
  return (
    <div className="content-stretch flex flex-col gap-2 items-start justify-start relative shrink-0 w-full">
      <Frame73 />
      <Frame74 />
    </div>
  );
}

function Description1() {
  return (
    <div className="absolute bg-[#ffffff] box-border content-stretch flex flex-col gap-5 items-start justify-start left-[54px] px-6 py-8 rounded-[8px] top-[268px] w-[480px]" data-name="description">
      <Frame71 />
    </div>
  );
}

function Frame75() {
  return (
    <div className="bg-[#e40d4e] content-stretch flex flex-col gap-2.5 items-center justify-center relative rounded-[100px] shrink-0 size-5">
      <div className="font-['Pretendard:Medium',_sans-serif] leading-[0] not-italic relative shrink-0 text-[#ffffff] text-[14px] text-nowrap">
        <p className="leading-[19px] whitespace-pre">3</p>
      </div>
    </div>
  );
}

function Frame76() {
  return (
    <div className="content-stretch flex gap-2.5 items-start justify-start relative shrink-0 w-full">
      <Frame75 />
      <div className="basis-0 font-['Pretendard:Medium',_sans-serif] grow leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#111212] text-[16px]">
        <p className="leading-[21px]">동의 체크 항목</p>
      </div>
    </div>
  );
}

function Frame77() {
  return (
    <div className="relative shrink-0 w-full">
      <div className="flex flex-row items-center justify-center relative size-full">
        <div className="box-border content-stretch flex gap-2.5 items-center justify-center pl-6 pr-0 py-0 relative w-full">
          <div className="basis-0 font-['Pretendard:Regular',_sans-serif] grow leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#111212] text-[14px]">
            <ul className="css-ed5n1g">
              <li className="list-disc mb-0 ms-[21px]">
                <span className="leading-[19px]">이용약관 / 개인정보처리방침 / 제3자 동의 / 마케팅 동의</span>
              </li>
              <ul className="css-ed5n1g">
                <li className="list-disc mb-0 ms-[42px]">
                  <span className="leading-[19px]">필수 항목은 체크 안할 시 비밀번호 제출 form 제출 불가</span>
                </li>
                <ul className="css-ed5n1g mb-0">
                  <li className="list-disc ms-[63px]">
                    <span className="leading-[19px]">error 상태의 인풋으로 변환 → 체크 시 default 상태로 돌아옴</span>
                  </li>
                </ul>
                <li className="list-disc ms-[42px]">
                  <span className="leading-[19px]">선택 항목은 체크 안하더라도 제출 가능</span>
                </li>
              </ul>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame78() {
  return (
    <div className="content-stretch flex flex-col gap-2 items-start justify-start relative shrink-0 w-full">
      <Frame76 />
      <Frame77 />
    </div>
  );
}

function Description2() {
  return (
    <div className="absolute bg-[#ffffff] box-border content-stretch flex flex-col gap-5 items-start justify-start left-[54px] px-6 py-8 rounded-[8px] top-[609px] w-[480px]" data-name="description">
      <Frame78 />
    </div>
  );
}

function Frame79() {
  return (
    <div className="bg-[#e40d4e] content-stretch flex flex-col gap-2.5 items-center justify-center relative rounded-[100px] shrink-0 size-5">
      <div className="font-['Pretendard:Medium',_sans-serif] leading-[0] not-italic relative shrink-0 text-[#ffffff] text-[14px] text-nowrap">
        <p className="leading-[19px] whitespace-pre">4</p>
      </div>
    </div>
  );
}

function Frame80() {
  return (
    <div className="content-stretch flex gap-2.5 items-start justify-start relative shrink-0 w-full">
      <Frame79 />
      <div className="basis-0 font-['Pretendard:Medium',_sans-serif] grow leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#111212] text-[16px]">
        <p className="leading-[21px]">비밀번호 등록</p>
      </div>
    </div>
  );
}

function Frame81() {
  return (
    <div className="relative shrink-0 w-full">
      <div className="flex flex-row items-center justify-center relative size-full">
        <div className="box-border content-stretch flex gap-2.5 items-center justify-center pl-6 pr-0 py-0 relative w-full">
          <div className="basis-0 font-['Pretendard:Regular',_sans-serif] grow leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#111212] text-[14px]">
            <ul className="css-ed5n1g">
              <li className="list-disc mb-0 ms-[21px]">
                <span className="leading-[19px]">validation 통과 및 제출 완료 시 회원 데이터를 업데이트합니다.</span>
              </li>
              <ul className="css-ed5n1g list-disc">
                <li className="mb-0 ms-[42px]">
                  <span className="leading-[19px]">비밀번호</span>
                </li>
                <li className="mb-0 ms-[42px]">
                  <span className="leading-[19px]">비밀번호 확인</span>
                </li>
                <li className="mb-0 ms-[42px]">
                  <span className="leading-[19px]">동의 boolean 및 마케팅 동의일시</span>
                </li>
                <li className="ms-[42px]">
                  <span className="leading-[19px]">회원 상태 - ACTIVE</span>
                </li>
              </ul>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame82() {
  return (
    <div className="content-stretch flex flex-col gap-2 items-start justify-start relative shrink-0 w-full">
      <Frame80 />
      <Frame81 />
    </div>
  );
}

function Description3() {
  return (
    <div className="absolute bg-[#ffffff] box-border content-stretch flex flex-col gap-5 items-start justify-start left-[54px] px-6 py-8 rounded-[8px] top-[798px] w-[480px]" data-name="description">
      <Frame82 />
    </div>
  );
}

export default function Frame423() {
  return (
    <div className="bg-[#ececec] relative size-full">
      <Description />
      <Description1 />
      <Description2 />
      <Description3 />
    </div>
  );
}