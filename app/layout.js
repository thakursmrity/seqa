import "./globals.css";
import { WorkspaceProvider } from "../lib/workspace";

export const metadata = {
  title: "Seqa",
  description: "A simple sales workspace for small teams. A Sequor AI project.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <WorkspaceProvider>{children}</WorkspaceProvider>
      </body>
    </html>
  );
}
