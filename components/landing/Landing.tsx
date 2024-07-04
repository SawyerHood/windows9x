import React from "react";
import styles from "./Landing.module.css";
import cx from "classnames";

import clock from "./assets/clock.png";
import copy from "./assets/copy.png";
import done from "./assets/done.png";
import installer from "./assets/installer.png";
import notes from "./assets/notes.png";
import restart from "./assets/restart.png";
import sawyersoft from "./assets/sawyersoft.png";
import banner from "./assets/banner.png";

import Image, { StaticImageData } from "next/image";
import CountDown from "./CountDown";
import { Form, SignUpState } from "./Form";
import { login } from "@/lib/auth/actions";
import isLive from "@/lib/isLive";

async function signUp(
  _prevState: SignUpState,
  formData: FormData
): Promise<SignUpState> {
  "use server";
  const url = `https://getwaitlist.com/api/v1/signup`;

  const email = formData.get("email");

  if (email === process.env.SECRET_CODE) {
    await login();
    return { type: "success" };
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailPattern.test(email.toString())) {
    return { type: "error", error: "Invalid email address" };
  }
  try {
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, waitlist_id: 17993 }),
    });

    if (!resp.ok) {
      return { type: "error", error: "Failed to sign up" };
    }
  } catch (error) {
    return { type: "error", error: "Failed to sign up" };
  }
  return { type: "success" };
}

export const Landing = () => {
  return (
    <div className={styles.container}>
      <div className={styles.headingBar}>
        <h1>Windows 9X Setup</h1>
      </div>
      <div className={styles.columns}>
        <div className={cx(styles.column, styles.sidebar)}>
          <div className={styles.steps}>
            <Step iconSrc={installer}>Preparing to run Windows 9X Setup</Step>
            <Step iconSrc={notes} isHighlighted>
              Collecting information about your computer
            </Step>
            <Step iconSrc={copy}>
              Copying Windows 9X files to your computer
            </Step>
            <Step iconSrc={restart}>Restarting your computer</Step>
            <Step iconSrc={done}>
              Setting up hardware and finalizing settings
            </Step>
          </div>
          <div className={styles.timeRemaining}>
            <Image
              src={clock}
              alt="Clock"
              className={styles.icon}
              width={24}
              height={24}
            />
            <div className={styles.text}>
              <div>Estimated time remaining:</div>
              <div className={styles.time}>
                <CountDown />
              </div>
            </div>
          </div>
          <div className="info-box">
            If you decide not to accept the Agreement, Windows 9X Setup will
            quit and your computer will return to the previous environment.
          </div>
          <Image
            src={sawyersoft}
            className={styles.logo}
            alt="Sawyer Software Logo"
          />
        </div>
        <div className={styles.main}>{isLive ? <Login /> : <WaitList />}</div>
      </div>
    </div>
  );
};

function Step({
  iconSrc,
  children,
  isHighlighted = false,
}: {
  iconSrc: string | StaticImageData;
  children: React.ReactNode;
  isHighlighted?: boolean;
}) {
  return (
    <div className={styles.step}>
      <Image
        src={iconSrc}
        alt="Step Icon"
        className={styles.icon}
        width={24}
        height={24}
      />
      <div className={isHighlighted ? styles.highlight : ""}>{children}</div>
    </div>
  );
}

function Login() {
  return (
    <div className="window">
      <div className="title-bar">
        <div className="title-bar-text">Login</div>
        <div className="title-bar-controls">
          <button aria-label="Minimize"></button>
          <button aria-label="Maximize"></button>
          <button aria-label="Close"></button>
        </div>
      </div>
      <div className="window-body">
        <div className={styles.imgContainer}>
          <Image src={banner} alt="Windows 9X" />
        </div>
        <div className={styles.copy}>
          <h2>Welcome to Windows 9X</h2>
          <p>
            Windows 9X is a simulacrum of an OS from the 90s but all
            applications are generated using <b>AI</b>.
          </p>
          <p>
            Windows 9X leverages cutting-edge artificial intelligence
            technology, <b>SawyerSoft IntelliOptimize™</b>, to optimize user
            experience and drive unparalleled operational efficiency.
          </p>
          <p>
            Apps are created on the fly, and anything you can imagine can become
            reality.
          </p>
          <form>
            <button formAction={login}>Sign In With Google</button>
          </form>
        </div>
      </div>
    </div>
  );
}

function WaitList() {
  return (
    <div className="window">
      <div className="title-bar">
        <div className="title-bar-text">Windows 9x Waitlist</div>
        <div className="title-bar-controls">
          <button aria-label="Minimize"></button>
          <button aria-label="Maximize"></button>
          <button aria-label="Close"></button>
        </div>
      </div>
      <div className="window-body">
        <div className={styles.imgContainer}>
          <Image src={banner} alt="Windows 9X" />
        </div>
        <div className={styles.copy}>
          <h2>Coming Soon: Windows 9X</h2>
          <p>
            Windows 9X is a simulacrum of an OS from the 90s but all
            applications are generated using <b>AI</b>.
          </p>
          <p>
            Windows 9X leverages cutting-edge artificial intelligence
            technology, <b>SawyerSoft IntelliOptimize™</b>, to optimize user
            experience and drive unparalleled operational efficiency.
          </p>
          <p>
            Apps are created on the fly, and any and all of your desires can be
            achieved.
          </p>
          <p>
            You can follow development progress{" "}
            <a href="https://x.com/sawyerhood">here</a>.
          </p>
          <p>
            Sign up to be notified when <b>Windows 9x</b> is available:
          </p>
          <Form action={signUp}></Form>
        </div>
      </div>
    </div>
  );
}
