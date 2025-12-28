import Image from "next/image";
import { IMG_URL } from "@/constants/dbConstants";

export default function Loading() {
    return (
        <div className="relative overflow-hidden" aria-label="Loading">
            <Image
                src={`${IMG_URL}/common/ci_vc_gray.png`}
                width={206}
                height={120}
                className="absolute inset-0 w-full h-full object-contain select-none pointer-events-none"
                draggable={false}
            />

            <Image
                src={`${IMG_URL}/common/ci_vc_navy.png`}
                width={206}
                height={120}
                className="absolute inset-0 w-full h-full object-contain select-none pointer-events-none logo-fill"
                draggable={false}
            />
        </div>
    );
}
