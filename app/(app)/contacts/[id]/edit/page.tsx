import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getContact } from "@/lib/data";
import { uuid } from "@/lib/validation";
import { PageHeader } from "@/components/page-header";
import { ContactForm } from "@/components/contact-form";

export const metadata: Metadata = { title: "Edit recruiter" };

export default async function EditContactPage(props: PageProps<"/contacts/[id]/edit">) {
  const { id } = await props.params;
  if (!uuid.safeParse(id).success) notFound();
  const data = await getContact(id);
  if (!data) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Edit recruiter" description={data.contact.name} />
      <ContactForm contact={data.contact} />
    </div>
  );
}
