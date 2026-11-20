import "./globals.css";

export const metadata = {
  title: "Seqa",
  description: "A guided prospect-brief agent. A Sequor AI project.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
