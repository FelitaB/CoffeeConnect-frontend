import Image from "next/image";
import styles from "./page.module.css";

export default function CompanyLogo() {
  return (
    <div className={styles.companyLogo}>
      <Image
        className={styles.companyLogoImage}
        src="/fabs-logo.png"
        alt="FABS Consulting"
        width={572}
        height={322}
      />
    </div>
  );
}