import AdminLayout from "@/components/admin/AdminLayout";
import { SignIn, SignedOut, SignedIn } from "@clerk/nextjs";

export const metadata = {
    title: "GoCart. - Admin",
    description: "GoCart. - Admin",
};

export default function RootAdminLayout({ children }) {

    return (
        <>
            <AdminLayout>
                {children}
            </AdminLayout>
        </>
    );
}
