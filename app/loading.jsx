import Image from "next/image";
import { IMG_URL } from "@/constants/dbConstants";

export default function Loading() {
    return (
        <div
            className="w-[206px] h-[120px] m-auto relative overflow-hidden shrink-0"
            aria-label="Loading"
        >
            <Image
                src={`${IMG_URL}/common/ci_vc_gray.png`}
                width={206}
                height={120}
                className="absolute inset-0 w-full h-full object-contain select-none pointer-events-none"
                draggable={false}
                alt="no image"
                unoptimized
            />

            <Image
                src={`${IMG_URL}/common/ci_vc_navy.png`}
                width={206}
                height={120}
                className="absolute inset-0 w-full h-full object-contain select-none pointer-events-none logo-fill"
                draggable={false}
                alt="no image"
                unoptimized
            />
        </div>
    );
}
