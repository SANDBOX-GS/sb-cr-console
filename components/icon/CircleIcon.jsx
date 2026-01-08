export const CircleIcon = ({ className = "" }) => {
    return (
        <div className={className}>
            <svg
                width="80"
                height="80"
                viewBox="0 0 80 80"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <g filter="url(#filter0_d_115_1655)">
                    <circle cx="40" cy="40" r="16" fill="#38BDF8" />
                </g>
                <defs>
                    <filter
                        id="filter0_d_115_1655"
                        x="20.878"
                        y="20.878"
                        width="40.3252"
                        height="40.3252"
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
                            result="effect1_dropShadow_115_1655"
                        />
                        <feBlend
                            mode="normal"
                            in="SourceGraphic"
                            in2="effect1_dropShadow_115_1655"
                            result="shape"
                        />
                    </filter>
                </defs>
            </svg>
        </div>
    );
};
