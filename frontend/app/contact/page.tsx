"use client";

import { useEffect } from "react";
import useAuthStore from "@/store/authSlice";
import { useModalStore } from "@/store/modalSlice";

const Contact = () => {
  const { checkAuthentication } = useAuthStore();

  useEffect(() => {
    checkAuthentication();
  }, [checkAuthentication]);

  useEffect(() => {
    useModalStore.setState({ currentPage: "contact" });
  }, []);

  return (
    <>
      <div className="min-h-screen overflow-x-auto">
        <div className="relative isolate pt-14">
          {/* Contact Us Content */}
          <div className="py-24 sm:py-32 lg:pb-40">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
              <div className="mx-auto max-w-2xl text-center text-black dark:text-white">
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  Contact Us
                </h1>
                <p className="mt-6 text-lg leading-8">
                  Have questions or need to report an issue? Get in touch with
                  us.
                </p>

                {/* Email Section */}
                <div className="mt-8">
                  <h2 className="text-2xl font-semibold">Email Us</h2>
                  <a
                    href="mailto:hoagie@princeton.edu"
                    className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 mt-2 block"
                  >
                    hoagie@princeton.edu
                  </a>
                </div>

                {/* Bug Report Section */}
                <div className="mt-8">
                  <h2 className="text-2xl font-semibold">Report a Bug</h2>
                  <p className="mt-2">
                    Found a bug or wish to give us feedback? Let us know by
                    filling out this
                    <a
                      href="https://docs.google.com/forms/d/e/1FAIpQLSdvWEVMBK5U5GZjc-zI1VOWtannw8v5eXquPhv8JBHpN7kVSw/viewform?usp=sf_link"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 ml-1"
                    >
                      form.
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Contact;
