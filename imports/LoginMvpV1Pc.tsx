import svgPaths from "./svg-dfaq4i8l7r";
import imgCiHzNavy01 from "figma:asset/1e236bc99eb7a494b80f8d87dd62f48caff94949.png";

function ButtonText() {
  return (
    <div className="content-stretch flex gap-1 items-center justify-start relative shrink-0" data-name="button.text">
      <div className="font-['Pretendard:Medium',_sans-serif] leading-[0] not-italic relative shrink-0 text-[13px] text-center text-nowrap text-slate-700">
        <p className="leading-[1.6] whitespace-pre">로그인</p>
      </div>
    </div>
  );
}

function ButtonSb() {
  return (
    <div className="box-border content-stretch flex gap-2.5 h-8 items-center justify-center px-2 py-0.5 relative rounded-[4px] shrink-0" data-name="Button.sb">
      <ButtonText />
    </div>
  );
}

function Frame2() {
  return (
    <div className="content-stretch flex gap-10 items-center justify-start relative shrink-0">
      <ButtonSb />
    </div>
  );
}

function Header() {
  return (
    <div className="bg-slate-100 h-[66px] relative shrink-0 w-full" data-name="header">
      <div className="flex flex-row items-center overflow-clip relative size-full">
        <div className="box-border content-stretch flex h-[66px] items-center justify-between px-8 py-4 relative w-full">
          <div className="bg-center bg-cover bg-no-repeat h-5 shrink-0 w-[162px]" data-name="ci_hz_navy-01" style={{ backgroundImage: `url('${imgCiHzNavy01}')` }} />
          <Frame2 />
        </div>
      </div>
      <div aria-hidden="true" className="absolute border-[0px_0px_1px] border-slate-300 border-solid inset-0 pointer-events-none" />
    </div>
  );
}

function Frame398() {
  return (
    <div className="relative shrink-0 w-full">
      <div className="flex flex-col items-center relative size-full">
        <div className="box-border content-stretch flex flex-col gap-4 items-center justify-start leading-[0] not-italic px-6 py-0 relative text-center text-slate-800 w-full">
          <div className="font-['Pretendard:Bold',_sans-serif] relative shrink-0 text-[32px] tracking-[-0.24px] w-full">
            <p className="leading-[1.6]">크리에이터 정산 계정 등록</p>
          </div>
          <div className="font-['Pretendard:Medium',_sans-serif] relative shrink-0 text-[18px] w-full">
            <p className="leading-[1.6]">아래에서 로그인 계정 주소를 확인하고 비밀번호를 등록해 주세요.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field() {
  return (
    <div className="bg-[#ffffff] relative rounded-[6px] shrink-0 w-full" data-name="field">
      <div aria-hidden="true" className="absolute border border-slate-300 border-solid inset-[-1px] pointer-events-none rounded-[7px]" />
      <div className="flex flex-row items-center relative size-full">
        <div className="box-border content-stretch flex items-center justify-between pb-3 pt-2.5 px-4 relative w-full">
          <div className="basis-0 font-['Pretendard:Regular',_sans-serif] grow leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[16px] text-slate-400 tracking-[-0.48px]">
            <p className="leading-[1.6]">이메일</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Default() {
  return (
    <div className="basis-0 content-stretch flex flex-col gap-1.5 grow items-start justify-start min-h-px min-w-px relative shrink-0" data-name="default">
      <Field />
    </div>
  );
}

function InputWithButton() {
  return (
    <div className="content-stretch flex gap-2 items-start justify-start relative shrink-0 w-full" data-name="input/with button">
      <Default />
    </div>
  );
}

function Input() {
  return (
    <div className="content-stretch flex flex-col gap-1.5 items-start justify-start relative shrink-0 w-full" data-name="input">
      <InputWithButton />
    </div>
  );
}

function Frame414() {
  return (
    <div className="content-stretch flex flex-col gap-2 items-start justify-start relative shrink-0 w-full">
      <div className="font-['Pretendard:Medium',_sans-serif] leading-[0] not-italic relative shrink-0 text-[18px] text-slate-800 w-full">
        <p className="leading-[1.6]">로그인 계정</p>
      </div>
      <div className="font-['Pretendard:Medium',_sans-serif] leading-[0] not-italic relative shrink-0 text-[16px] text-slate-600 w-full">
        <p className="leading-[1.6]">이메일을 수신한 ? 이메일 주소를 입력해 주세요.</p>
      </div>
      <Input />
    </div>
  );
}

function EyeInvisible() {
  return (
    <div className="relative shrink-0 size-6" data-name="EyeInvisible">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="EyeInvisible">
          <path d={svgPaths.p8af1c80} fill="var(--fill-0, #94A3B8)" id="Vector" />
          <path d={svgPaths.p59a19c0} fill="var(--fill-0, #94A3B8)" id="Vector_2" />
        </g>
      </svg>
    </div>
  );
}

function Field1() {
  return (
    <div className="bg-[#ffffff] relative rounded-[6px] shrink-0 w-full" data-name="field">
      <div aria-hidden="true" className="absolute border border-slate-300 border-solid inset-[-1px] pointer-events-none rounded-[7px]" />
      <div className="flex flex-row items-center relative size-full">
        <div className="box-border content-stretch flex items-center justify-between pb-3 pt-2.5 px-4 relative w-full">
          <div className="basis-0 font-['Pretendard:Regular',_sans-serif] grow leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[16px] text-slate-400 tracking-[-0.48px]">
            <p className="leading-[1.6]">비밀번호</p>
          </div>
          <EyeInvisible />
        </div>
      </div>
    </div>
  );
}

function Default1() {
  return (
    <div className="basis-0 content-stretch flex flex-col gap-1.5 grow items-start justify-start min-h-px min-w-px relative shrink-0" data-name="default">
      <Field1 />
    </div>
  );
}

function InputWithButton1() {
  return (
    <div className="content-stretch flex gap-2 items-start justify-start relative shrink-0 w-full" data-name="input/with button">
      <Default1 />
    </div>
  );
}

function Input1() {
  return (
    <div className="content-stretch flex flex-col gap-1.5 items-start justify-start relative shrink-0 w-full" data-name="input">
      <InputWithButton1 />
    </div>
  );
}

function EyeInvisible1() {
  return (
    <div className="relative shrink-0 size-6" data-name="EyeInvisible">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="EyeInvisible">
          <path d={svgPaths.p8af1c80} fill="var(--fill-0, #94A3B8)" id="Vector" />
          <path d={svgPaths.p59a19c0} fill="var(--fill-0, #94A3B8)" id="Vector_2" />
        </g>
      </svg>
    </div>
  );
}

function Field2() {
  return (
    <div className="bg-[#ffffff] relative rounded-[6px] shrink-0 w-full" data-name="field">
      <div aria-hidden="true" className="absolute border border-slate-300 border-solid inset-[-1px] pointer-events-none rounded-[7px]" />
      <div className="flex flex-row items-center relative size-full">
        <div className="box-border content-stretch flex items-center justify-between pb-3 pt-2.5 px-4 relative w-full">
          <div className="basis-0 font-['Pretendard:Regular',_sans-serif] grow leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[16px] text-slate-400 tracking-[-0.48px]">
            <p className="leading-[1.6]">비밀번호 확인</p>
          </div>
          <EyeInvisible1 />
        </div>
      </div>
    </div>
  );
}

function Default2() {
  return (
    <div className="basis-0 content-stretch flex flex-col gap-1.5 grow items-start justify-start min-h-px min-w-px relative shrink-0" data-name="default">
      <Field2 />
    </div>
  );
}

function InputWithButton2() {
  return (
    <div className="content-stretch flex gap-2 items-start justify-start relative shrink-0 w-full" data-name="input/with button">
      <Default2 />
    </div>
  );
}

function Input2() {
  return (
    <div className="content-stretch flex flex-col gap-1.5 items-start justify-start relative shrink-0 w-full" data-name="input">
      <InputWithButton2 />
    </div>
  );
}

function Frame415() {
  return (
    <div className="content-stretch flex flex-col gap-2 items-start justify-start relative shrink-0 w-full">
      <Input1 />
      <Input2 />
    </div>
  );
}

function Frame418() {
  return (
    <div className="content-stretch flex flex-col gap-4 items-start justify-start relative shrink-0 w-full">
      <Frame415 />
    </div>
  );
}

function Frame417() {
  return (
    <div className="content-stretch flex flex-col gap-2 items-start justify-start relative shrink-0 w-full">
      <div className="font-['Pretendard:Medium',_sans-serif] leading-[0] not-italic relative shrink-0 text-[18px] text-slate-800 w-full">
        <p className="leading-[1.6]">비밀번호 등록 및 계정 활성화</p>
      </div>
      <Frame418 />
    </div>
  );
}

function CheckCircle() {
  return (
    <div className="relative shrink-0 size-4" data-name="CheckCircle">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g clipPath="url(#clip0_1_1844)" id="CheckCircle">
          <g id="Vector">
            <path d={svgPaths.p1016df00} fill="#64748B" />
            <path d={svgPaths.p2516ac00} fill="#64748B" />
          </g>
        </g>
        <defs>
          <clipPath id="clip0_1_1844">
            <rect fill="white" height="16" width="16" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Frame401() {
  return (
    <div className="content-stretch flex gap-2.5 items-center justify-center relative shrink-0 size-6">
      <CheckCircle />
    </div>
  );
}

function IconChevronDown() {
  return (
    <div className="relative shrink-0 size-4" data-name="icon/chevron-down">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="icon/chevron-down">
          <path d="M4 6L8 10L12 6" id="Vector" stroke="var(--stroke-0, #334155)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        </g>
      </svg>
    </div>
  );
}

function Frame405() {
  return (
    <div className="content-stretch flex gap-2.5 items-center justify-center relative shrink-0 size-6">
      <IconChevronDown />
    </div>
  );
}

function Frame403() {
  return (
    <div className="box-border content-stretch flex items-center justify-start px-0 py-1 relative shrink-0 w-full">
      <Frame401 />
      <div className="basis-0 font-['Pretendard:Medium',_sans-serif] grow leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[14px] text-slate-700">
        <p className="leading-[1.6]">전체 동의</p>
      </div>
      <Frame405 />
    </div>
  );
}

function Frame412() {
  return (
    <div className="box-border content-stretch flex flex-col gap-2 items-start justify-start px-0 py-2 relative shrink-0 w-full">
      <div aria-hidden="true" className="absolute border-[0px_0px_1px] border-slate-200 border-solid bottom-[-0.5px] left-0 pointer-events-none right-0 top-0" />
      <Frame403 />
    </div>
  );
}

function CheckCircle1() {
  return (
    <div className="relative shrink-0 size-4" data-name="CheckCircle">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g clipPath="url(#clip0_1_1844)" id="CheckCircle">
          <g id="Vector">
            <path d={svgPaths.p1016df00} fill="#64748B" />
            <path d={svgPaths.p2516ac00} fill="#64748B" />
          </g>
        </g>
        <defs>
          <clipPath id="clip0_1_1844">
            <rect fill="white" height="16" width="16" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Frame402() {
  return (
    <div className="content-stretch flex gap-2.5 items-center justify-center relative shrink-0 size-6">
      <CheckCircle1 />
    </div>
  );
}

function IconChevronDown1() {
  return (
    <div className="relative shrink-0 size-4" data-name="icon/chevron-down">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="icon/chevron-down">
          <path d="M4 6L8 10L12 6" id="Vector" stroke="var(--stroke-0, #334155)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        </g>
      </svg>
    </div>
  );
}

function Frame407() {
  return (
    <div className="content-stretch flex gap-2.5 items-center justify-center relative shrink-0 size-6">
      <IconChevronDown1 />
    </div>
  );
}

function Frame404() {
  return (
    <div className="box-border content-stretch flex items-center justify-start px-0 py-1 relative shrink-0 w-full">
      <Frame402 />
      <div className="basis-0 font-['Pretendard:Medium',_sans-serif] grow leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[14px] text-slate-700">
        <p className="leading-[1.6]">서비스 이용약관(필수)</p>
      </div>
      <Frame407 />
    </div>
  );
}

function Frame419() {
  return (
    <div className="box-border content-stretch flex flex-col gap-2 items-start justify-start px-0 py-2 relative shrink-0 w-full">
      <div aria-hidden="true" className="absolute border-[0px_0px_1px] border-slate-200 border-solid bottom-[-0.5px] left-0 pointer-events-none right-0 top-0" />
      <Frame404 />
    </div>
  );
}

function CheckCircle2() {
  return (
    <div className="relative shrink-0 size-[18px]" data-name="check-circle">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
        <g id="check-circle">
          <path d={svgPaths.pc962300} fill="var(--fill-0, #334155)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Frame406() {
  return (
    <div className="content-stretch flex gap-2.5 items-center justify-center relative shrink-0 size-6">
      <CheckCircle2 />
    </div>
  );
}

function IconChevronDown2() {
  return (
    <div className="relative shrink-0 size-4" data-name="icon/chevron-down">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="icon/chevron-down">
          <path d="M4 6L8 10L12 6" id="Vector" stroke="var(--stroke-0, #334155)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        </g>
      </svg>
    </div>
  );
}

function Frame408() {
  return (
    <div className="content-stretch flex gap-2.5 items-center justify-center relative shrink-0 size-6">
      <IconChevronDown2 />
    </div>
  );
}

function Frame409() {
  return (
    <div className="box-border content-stretch flex items-center justify-start px-0 py-1 relative shrink-0 w-full">
      <Frame406 />
      <div className="basis-0 font-['Pretendard:Medium',_sans-serif] grow leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[14px] text-slate-700">
        <p className="leading-[1.6]">개인정보 수집 및 이용에 대한 안내(필수)</p>
      </div>
      <Frame408 />
    </div>
  );
}

function Frame410() {
  return (
    <div className="box-border content-stretch flex flex-col gap-2 items-start justify-start px-0 py-2 relative shrink-0 w-full">
      <div aria-hidden="true" className="absolute border-[0px_0px_1px] border-slate-200 border-solid bottom-[-0.5px] left-0 pointer-events-none right-0 top-0" />
      <Frame409 />
    </div>
  );
}

function CheckCircle3() {
  return (
    <div className="relative shrink-0 size-[18px]" data-name="check-circle">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
        <g id="check-circle">
          <path d={svgPaths.pc962300} fill="var(--fill-0, #334155)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Frame411() {
  return (
    <div className="content-stretch flex gap-2.5 items-center justify-center relative shrink-0 size-6">
      <CheckCircle3 />
    </div>
  );
}

function IconChevronDown3() {
  return (
    <div className="relative shrink-0 size-4" data-name="icon/chevron-down">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="icon/chevron-down">
          <path d="M4 6L8 10L12 6" id="Vector" stroke="var(--stroke-0, #334155)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        </g>
      </svg>
    </div>
  );
}

function Frame420() {
  return (
    <div className="content-stretch flex gap-2.5 items-center justify-center relative shrink-0 size-6">
      <IconChevronDown3 />
    </div>
  );
}

function Frame421() {
  return (
    <div className="box-border content-stretch flex items-center justify-start px-0 py-1 relative shrink-0 w-full">
      <Frame411 />
      <div className="basis-0 font-['Pretendard:Medium',_sans-serif] grow leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[14px] text-slate-700">
        <p className="leading-[1.6]">개인정보 제 3자 제공 동의(필수)</p>
      </div>
      <Frame420 />
    </div>
  );
}

function Frame413() {
  return (
    <div className="box-border content-stretch flex flex-col gap-2 items-start justify-start px-0 py-2 relative shrink-0 w-full">
      <div aria-hidden="true" className="absolute border-[0px_0px_1px] border-slate-200 border-solid bottom-[-0.5px] left-0 pointer-events-none right-0 top-0" />
      <Frame421 />
    </div>
  );
}

function CheckCircle4() {
  return (
    <div className="relative shrink-0 size-[18px]" data-name="check-circle">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
        <g id="check-circle">
          <path d={svgPaths.pc962300} fill="var(--fill-0, #334155)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Frame423() {
  return (
    <div className="content-stretch flex gap-2.5 items-center justify-center relative shrink-0 size-6">
      <CheckCircle4 />
    </div>
  );
}

function IconChevronDown4() {
  return (
    <div className="relative shrink-0 size-4" data-name="icon/chevron-down">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="icon/chevron-down">
          <path d="M4 6L8 10L12 6" id="Vector" stroke="var(--stroke-0, #334155)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        </g>
      </svg>
    </div>
  );
}

function Frame424() {
  return (
    <div className="content-stretch flex gap-2.5 items-center justify-center relative shrink-0 size-6">
      <IconChevronDown4 />
    </div>
  );
}

function Frame425() {
  return (
    <div className="box-border content-stretch flex items-center justify-start px-0 py-1 relative shrink-0 w-full">
      <Frame423 />
      <div className="basis-0 font-['Pretendard:Medium',_sans-serif] grow leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[14px] text-slate-700">
        <p className="leading-[1.6]">마케팅 및 혜택 프로모션 알림 동의(선택)</p>
      </div>
      <Frame424 />
    </div>
  );
}

function Frame426() {
  return (
    <div className="box-border content-stretch flex flex-col gap-2 items-start justify-start px-0 py-2 relative shrink-0 w-full">
      <div aria-hidden="true" className="absolute border-[0px_0px_1px] border-slate-200 border-solid bottom-[-0.5px] left-0 pointer-events-none right-0 top-0" />
      <Frame425 />
    </div>
  );
}

function Frame422() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full">
      <Frame419 />
      <Frame410 />
      <Frame413 />
      <Frame426 />
    </div>
  );
}

function Frame416() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full">
      <Frame412 />
      <Frame422 />
    </div>
  );
}

function ButtonText1() {
  return (
    <div className="content-stretch flex gap-2 items-center justify-start relative shrink-0" data-name="button.text">
      <div className="font-['Pretendard:Medium',_sans-serif] leading-[0] not-italic relative shrink-0 text-[#ffffff] text-[16px] text-center text-nowrap">
        <p className="leading-[1.6] whitespace-pre">비밀번호 등록</p>
      </div>
    </div>
  );
}

function ButtonSb1() {
  return (
    <div className="basis-0 bg-slate-700 grow h-12 min-h-px min-w-20 relative rounded-[4px] shrink-0" data-name="Button.sb">
      <div className="flex flex-row items-center justify-center min-w-inherit relative size-full">
        <div className="box-border content-stretch flex gap-2.5 h-12 items-center justify-center min-w-inherit px-5 py-2 relative w-full">
          <ButtonText1 />
        </div>
      </div>
    </div>
  );
}

function Frame9() {
  return (
    <div className="content-stretch flex gap-6 items-center justify-start relative shrink-0 w-full">
      <ButtonSb1 />
    </div>
  );
}

function Frame399() {
  return (
    <div className="bg-[#ffffff] max-w-[328px] relative rounded-[8px] shrink-0 w-full">
      <div className="max-w-inherit overflow-clip relative size-full">
        <div className="box-border content-stretch flex flex-col gap-6 items-start justify-start max-w-inherit px-6 py-8 relative w-full">
          <Frame414 />
          <Frame417 />
          <Frame416 />
          <Frame9 />
        </div>
      </div>
      <div aria-hidden="true" className="absolute border border-slate-100 border-solid inset-0 pointer-events-none rounded-[8px] shadow-[0px_0px_8px_0px_rgba(203,213,225,0.3)]" />
    </div>
  );
}

function Body() {
  return (
    <div className="basis-0 bg-slate-50 box-border content-stretch flex flex-col gap-10 grow items-center justify-start min-h-px min-w-px overflow-clip px-0 py-[88px] relative shrink-0 w-full" data-name="body">
      <Frame398 />
      <Frame399 />
    </div>
  );
}

function G552() {
  return (
    <div className="h-8 relative w-[46.233px]" data-name="g552">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 47 32">
        <g id="g552">
          <path d={svgPaths.p2b99d040} fill="var(--fill-0, #64748B)" id="path558" />
        </g>
      </svg>
    </div>
  );
}

function Frame43() {
  return (
    <div className="content-stretch flex gap-2 items-center justify-start relative shrink-0">
      <div className="relative shrink-0">
        <p className="leading-[1.6] text-nowrap whitespace-pre">(주)샌드박스네트워크</p>
      </div>
      <div className="relative shrink-0">
        <p className="leading-[1.6] text-nowrap whitespace-pre">서울시 용산구 서빙고로 17 센트럴타워 28~30F</p>
      </div>
      <div className="relative shrink-0">
        <p className="leading-[1.6] text-nowrap whitespace-pre">사업자등록번호 : 220-88-89136</p>
      </div>
    </div>
  );
}

function Frame3() {
  return (
    <div className="content-stretch flex flex-col font-['Pretendard:Regular',_sans-serif] items-start justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-nowrap text-slate-400">
      <Frame43 />
      <div className="relative shrink-0">
        <p className="leading-[1.6] text-nowrap whitespace-pre">{`© 2025.  SANDBOX NETWORK Inc. All Rights Reserved`}</p>
      </div>
    </div>
  );
}

function Frame46() {
  return (
    <div className="content-stretch flex gap-5 items-center justify-start relative shrink-0">
      <div className="flex items-center justify-center relative shrink-0">
        <div className="flex-none scale-y-[-100%]">
          <G552 />
        </div>
      </div>
      <Frame3 />
    </div>
  );
}

function Frame45() {
  return (
    <div className="content-stretch flex gap-4 items-start justify-start leading-[0] not-italic relative shrink-0 text-[13px] text-nowrap text-slate-500 w-full">
      <div className="font-['Pretendard:Regular',_sans-serif] relative shrink-0">
        <p className="leading-[1.6] text-nowrap whitespace-pre">공지사항</p>
      </div>
      <div className="font-['Pretendard:Regular',_sans-serif] relative shrink-0">
        <p className="leading-[1.6] text-nowrap whitespace-pre">이용약관</p>
      </div>
      <div className="font-['Pretendard:Medium',_sans-serif] relative shrink-0">
        <p className="leading-[1.6] text-nowrap whitespace-pre">개인정보처리방침</p>
      </div>
    </div>
  );
}

function IconMail() {
  return (
    <div className="relative shrink-0 size-3" data-name="icon/mail">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 12">
        <g id="icon/mail">
          <path d={svgPaths.pcd45380} id="Vector" stroke="var(--stroke-0, #94A3B8)" strokeLinecap="round" strokeLinejoin="round" />
          <path d={svgPaths.p9deeb00} id="Vector_2" stroke="var(--stroke-0, #94A3B8)" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </svg>
    </div>
  );
}

function Frame273() {
  return (
    <div className="content-stretch flex gap-1 items-center justify-center relative shrink-0">
      <IconMail />
      <div className="font-['Pretendard:Regular',_sans-serif] leading-[0] not-italic relative shrink-0 text-[12px] text-nowrap text-slate-400">
        <p className="leading-[1.6] whitespace-pre">contact@sandboxnetwork.net</p>
      </div>
    </div>
  );
}

function Frame44() {
  return (
    <div className="content-stretch flex flex-col items-end justify-center relative shrink-0">
      <Frame45 />
      <Frame273 />
    </div>
  );
}

function Footer() {
  return (
    <div className="bg-slate-100 relative shrink-0 w-full" data-name="footer">
      <div className="flex flex-row items-center overflow-clip relative size-full">
        <div className="box-border content-stretch flex items-center justify-between px-8 py-4 relative w-full">
          <Frame46 />
          <Frame44 />
        </div>
      </div>
      <div aria-hidden="true" className="absolute border-[1px_0px_0px] border-slate-300 border-solid inset-0 pointer-events-none" />
    </div>
  );
}

function Layout() {
  return (
    <div className="absolute bg-[#ffffff] content-stretch flex flex-col h-[1145px] items-start justify-between left-0 overflow-clip top-0 w-[1440px]" data-name="layout">
      <Header />
      <Body />
      <Footer />
    </div>
  );
}

export default function LoginMvpV1Pc() {
  return (
    <div className="bg-[#ffffff] relative size-full" data-name="login_mvp_v1_pc">
      <div className="absolute font-['SB_AggroOTF:Medium',_sans-serif] leading-[0] left-[129px] not-italic text-[#000000] text-[32px] text-nowrap top-[197px] tracking-[-0.24px]">
        <p className="leading-[1.6] whitespace-pre">로그인</p>
      </div>
      <Layout />
    </div>
  );
}