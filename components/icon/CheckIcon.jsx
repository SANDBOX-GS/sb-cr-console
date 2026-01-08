export const CheckIcon = ({ className = "" }) => {
    return (
        <div className={className}>
            <svg
                width="80"
                height="80"
                viewBox="0 0 80 80"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <g filter="url(#filter0_d_115_1651)">
                    <circle
                        cx="39.9997"
                        cy="39.9997"
                        r="26.6667"
                        fill="url(#paint0_linear_115_1651)"
                    />
                </g>
                <g filter="url(#filter1_di_115_1651)">
                    <path
                        d="M27.1221 40.6158L36.0548 48.6603C36.8931 49.4152 38.1801 49.3649 38.9569 48.5469L52.8782 33.8867"
                        stroke="white"
                        stroke-width="5.20325"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    />
                </g>
                <defs>
                    <filter
                        id="filter0_d_115_1651"
                        x="10.2111"
                        y="10.2111"
                        width="61.6582"
                        height="61.6582"
                        filterUnits="userSpaceOnUse"
                        colorInterpolation-filters="sRGB"
                    >
                        <feFlood floodOpacity="0" result="BackgroundImageFix" />
                        <feColorMatrix
                            in="SourceAlpha"
                            type="matrix"
                            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                            result="hardAlpha"
                        />
                        <feOffset dx="1.04065" dy="1.04065" />
                        <feGaussianBlur stdDeviation="2.0813" />
                        <feComposite in2="hardAlpha" operator="out" />
                        <feColorMatrix
                            type="matrix"
                            values="0 0 0 0 0.0917342 0 0 0 0 0.204447 0 0 0 0 0.388597 0 0 0 0.25 0"
                        />
                        <feBlend
                            mode="normal"
                            in2="BackgroundImageFix"
                            result="effect1_dropShadow_115_1651"
                        />
                        <feBlend
                            mode="normal"
                            in="SourceGraphic"
                            in2="effect1_dropShadow_115_1651"
                            result="shape"
                        />
                    </filter>
                    <filter
                        id="filter1_di_115_1651"
                        x="21.3986"
                        y="28.1632"
                        width="39.2842"
                        height="28.8369"
                        filterUnits="userSpaceOnUse"
                        colorInterpolation-filters="sRGB"
                    >
                        <feFlood floodOpacity="0" result="BackgroundImageFix" />
                        <feColorMatrix
                            in="SourceAlpha"
                            type="matrix"
                            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                            result="hardAlpha"
                        />
                        <feOffset dx="1.04065" dy="1.04065" />
                        <feGaussianBlur stdDeviation="2.0813" />
                        <feComposite in2="hardAlpha" operator="out" />
                        <feColorMatrix
                            type="matrix"
                            values="0 0 0 0 0.0745098 0 0 0 0 0.207843 0 0 0 0 0.427451 0 0 0 0.25 0"
                        />
                        <feBlend
                            mode="normal"
                            in2="BackgroundImageFix"
                            result="effect1_dropShadow_115_1651"
                        />
                        <feBlend
                            mode="normal"
                            in="SourceGraphic"
                            in2="effect1_dropShadow_115_1651"
                            result="shape"
                        />
                        <feColorMatrix
                            in="SourceAlpha"
                            type="matrix"
                            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                            result="hardAlpha"
                        />
                        <feOffset dx="1.04065" dy="1.04065" />
                        <feGaussianBlur stdDeviation="1.04065" />
                        <feComposite
                            in2="hardAlpha"
                            operator="arithmetic"
                            k2="-1"
                            k3="1"
                        />
                        <feColorMatrix
                            type="matrix"
                            values="0 0 0 0 0.0745098 0 0 0 0 0.207843 0 0 0 0 0.427451 0 0 0 0.25 0"
                        />
                        <feBlend
                            mode="normal"
                            in2="shape"
                            result="effect2_innerShadow_115_1651"
                        />
                    </filter>
                    <linearGradient
                        id="paint0_linear_115_1651"
                        x1="13.333"
                        y1="40.1298"
                        x2="66.6663"
                        y2="40.1298"
                        gradientUnits="userSpaceOnUse"
                    >
                        <stop stopColor="#22D3EE" />
                        <stop offset="1" stopColor="#0EA5E9" />
                    </linearGradient>
                </defs>
            </svg>
        </div>
    );
};
