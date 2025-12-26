import { useRouter } from "next/navigation";
import { APP_CONFIG } from "@/lib/constants";

export function HeaderLogo() {
    const router = useRouter();

    return (
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push("/")}>
            <h1 className="text-2xl font-bold">{APP_CONFIG.name}</h1>
            <span className="text-3xl">{APP_CONFIG.logo}</span>
        </div>
    );
}
