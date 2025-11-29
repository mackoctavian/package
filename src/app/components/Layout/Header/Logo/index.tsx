import Image from "next/image";
import Link from "next/link";

const Logo: React.FC = () => {
  return (
    <Link href="/">
      <Image
        src="/images/logo/dmrc.svg"
        alt="DMRC logo"
        width={60}
        height={20}
        quality={100}
      />
    </Link>
  );
};

export default Logo;
