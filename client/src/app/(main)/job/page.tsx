import ApplicationForm from '@/components/job/ApplicationForm'
import JobBanner from '@/components/job/JobBanner'
import { BadgeDollarSign, Bike, CalendarSync, Check, CircleOff, Smartphone, HeartHandshake, PhoneCall, FileSignature, PackageCheck } from 'lucide-react'
import { Card } from '@/components/ui/Card'

const advantages = [
    { icon: BadgeDollarSign, label: "Tips + bonuses" },
    { icon: Bike, label: "Work in your own transport or ours" },
    { icon: CircleOff, label: "No experience required" },
    { icon: CalendarSync, label: "Flexible schedule" },
];

const requirements = [
    { icon: Check, label: "Age 18+" },
    { icon: Smartphone, label: "Smartphone" },
    { icon: HeartHandshake, label: "Attentiveness and politeness" },
    { icon: Bike, label: "Bicycle / motorcycle / car" },
];

const steps = [
    { icon: FileSignature, label: "You fill out an application" },
    { icon: PhoneCall, label: "We call and conduct a short interview" },
    { icon: Check, label: "We sign a contract" },
    { icon: PackageCheck, label: "You go out for delivery" },
];

const InfoCard = ({ title, items }: { title: string; items: { icon: React.ComponentType<{ size?: number }>; label: string }[] }) => (
    <Card>
        <h2 className="section-title mb-4">{title}</h2>
        <div className="flex flex-col gap-3">
            {items.map((item) => (
                <div key={item.label} className="flex items-center gap-3 text-ink font-medium">
                    <span className="flex items-center justify-center size-9 rounded-full bg-ember-100 text-brand shrink-0">
                        <item.icon size={18} />
                    </span>
                    {item.label}
                </div>
            ))}
        </div>
    </Card>
);

const Page = () => {
    return (
        <div className="pb-10 flex flex-col gap-6">
            <JobBanner />
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <InfoCard title="Advantages" items={advantages} />
                <InfoCard title="Requirements" items={requirements} />
                <InfoCard title="How it works" items={steps} />
            </div>
            <Card>
                <h2 className="section-title mb-4">Application Form</h2>
                <ApplicationForm />
            </Card>
        </div>
    )
}

export default Page
