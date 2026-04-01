import Image from "next/image";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="#" className="flex items-center gap-2 font-medium">
            <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Image
                src="/brand/light/icon-transparent.svg"
                alt="Salkaro logo"
                width={16}
                height={16}
                className="size-4 dark:hidden"
              />
              <Image
                src="/brand/dark/icon-transparent.svg"
                alt="Salkaro logo"
                width={16}
                height={16}
                className="hidden size-4 dark:block"
              />
            </div>
            Salkaro Portal
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">{children}</div>
        </div>
      </div>
      <div className="relative hidden overflow-hidden bg-muted lg:block">
        <div className="absolute inset-0 bg-linear-to-br from-muted via-background to-muted" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,hsl(var(--border))_1px,transparent_0)] bg-size-[24px_24px] opacity-40" />
      </div>
    </div>
  );
}
