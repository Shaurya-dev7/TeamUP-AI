import { Typewriter } from "@/components/ui/typewriter-text";

const DemoVariant1 = () => {
    return (
        <>
            <Typewriter
                text={["Welcome to HextaUI", "Build awesome websites.", "hextaui.com"]}
                speed={100}
                loop={true}
                className="text-xl font-medium"
            />
        </>
    )
}

export { DemoVariant1 }
