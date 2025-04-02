import "./Styles.css";

export const metadata = {
  title: "Juan F. Agrón",
  description: "For over a decade, I’ve helped build products for companies large and small. As part of recidiviz, I design practical systems that actively reduce the amount of people incarcerated in the U.S. My work spans across Digital Products, Brand Identity, and Art Direction.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
