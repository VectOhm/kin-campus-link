import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import appCss from "../styles.css?url";
import { StoreProvider } from "@/erp/store/store";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-semibold text-foreground">404</h1>
        <h2 className="mt-4 text-lg font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Brightwood K-10 — School ERP" },
      {
        name: "description",
        content:
          "Modern School ERP for K-10 schools: admissions, fees, homework, results, transport, attendance and more.",
      },
      { property: "og:title", content: "Brightwood K-10 — School ERP" },
      { name: "twitter:title", content: "Brightwood K-10 — School ERP" },
      {
        property: "og:description",
        content:
          "Modern School ERP for K-10 schools: admissions, fees, homework, results, transport, attendance and more.",
      },
      {
        name: "twitter:description",
        content:
          "Modern School ERP for K-10 schools: admissions, fees, homework, results, transport, attendance and more.",
      },
      {
        property: "og:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/49afe923-0aed-420b-a70f-fb23dcb37cc1/id-preview-d2607c69--4858165f-fe96-47c0-923e-a7962ad527b5.lovable.app-1777183769046.png",
      },
      {
        name: "twitter:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/49afe923-0aed-420b-a70f-fb23dcb37cc1/id-preview-d2607c69--4858165f-fe96-47c0-923e-a7962ad527b5.lovable.app-1777183769046.png",
      },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <StoreProvider>
      <Outlet />
      <Toaster />
    </StoreProvider>
  );
}
