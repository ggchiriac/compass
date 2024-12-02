"use client";

import { SVGProps, useEffect } from "react";
import Image from "next/image";
import { useModalStore } from "@/store/modalSlice";

const foundingTeam = [
  {
    name: "Windsor Nguyen",
    gradYear: "2025",
    link: "https://www.linkedin.com/in/windsornguyen/",
  },
  {
    name: "Ijay Narang",
    gradYear: "2025",
    link: "https://www.linkedin.com/in/ijay-narang-20b968216/",
  },
  {
    name: "Kaan Odabas",
    gradYear: "2025",
    link: "https://www.linkedin.com/in/kaanbodabas/",
  },
  {
    name: "George Chiriac",
    gradYear: "2025",
    link: "https://www.linkedin.com/in/george-chiriac/",
  },
  {
    name: "Julia Kashimura",
    gradYear: "2025",
    link: "https://www.linkedin.com/in/juliakashimura/",
  },
];

const teamLeads = [
  {
    name: "Issac Li",
    gradYear: "2026",
    link: "https://www.linkedin.com/in/issactli/",
  },
  {
    name: "Gabriel Marin",
    gradYear: "2025",
    link: "https://www.linkedin.com/in/gabriel-marin-/",
  },
];

const contributors = [
  { name: "Lucy Chen", link: "https://www.linkedin.com/in/lucy-c1/" },
  { name: "Hannah Choi", link: "https://www.linkedin.com/in/hannah-e-choi/" },
  { name: "Tate Hutchins", link: "https://www.linkedin.com/in/tate-hutchins/" },
  { name: "Minjae Kwon", link: "https://www.linkedin.com/in/minjae-kwon" },
  { name: "Henry Li", link: "https://www.linkedin.com/in/henryli0508/" },
  { name: "Luke Sanborn", link: "https://www.linkedin.com/in/luke-sanborn/" },
  {
    name: "Jennifer Sanmartin",
    link: "https://www.linkedin.com/in/jennifer-sanmartin-115094279/",
  },
  {
    name: "Grace Tan",
    link: "https://www.linkedin.com/in/grace-tan-00449132a/",
  },
  {
    name: "Lucy Wang",
    link: "https://www.linkedin.com/in/lucy-wang-50895126a/",
  },
  { name: "Aaron Yang", link: "https://www.linkedin.com/in/yang-aaron/" },
  {
    name: "Daniel Yeo",
    link: "https://www.linkedin.com/in/daniel-yeo-320635248/",
  },
  {
    name: "Emily You",
    link: "https://www.linkedin.com/in/emily-you-0a0943215/",
  },
  {
    name: "Linsey Zhong",
    link: "https://www.linkedin.com/in/linsey-zhong-686a72309/",
  },
];

const LinkedInIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    x="0px"
    y="0px"
    width="36"
    height="36"
    viewBox="0 0 48 48"
    {...props}
  >
    <path
      fill="#0288D1"
      d="M42,37c0,2.762-2.238,5-5,5H11c-2.761,0-5-2.238-5-5V11c0-2.762,2.239-5,5-5h26c2.762,0,5,2.238,5,5V37z"
    />
    <path
      fill="#FFF"
      d="M12 19H17V36H12zM14.485 17h-.028C12.965 17 12 15.888 12 14.499 12 13.08 12.995 12 14.514 12c1.521 0 2.458 1.08 2.486 2.499C17 15.887 16.035 17 14.485 17zM36 36h-5v-9.099c0-2.198-1.225-3.698-3.192-3.698-1.501 0-2.313 1.012-2.707 1.99C24.957 25.543 25 26.511 25 27v9h-5V19h5v2.616C25.721 20.5 26.85 19 29.738 19c3.578 0 6.261 2.25 6.261 7.274L36 36 36 36z"
    />
  </svg>
);

const TeamMemberCard = ({ member, index }: { member: any; index: number }) => (
  <div className="bg-white p-6 rounded-lg shadow-sm">
    <div className="h-[180px] w-[180px] overflow-hidden rounded-lg">
      <Image
        src={`/member${index + 1}.jpg`}
        alt={member.name}
        width={180}
        height={180}
      />
    </div>
    <h3 className="mt-6 text-xl font-semibold">{member.name}</h3>
    <div className="flow-root">
      <p className="float-left text-xl">{member.gradYear}</p>
      <a
        href={member.link}
        className="float-right text-gray-400 hover:text-gray-500"
        target="_blank"
        rel="noopener noreferrer"
      >
        <span className="sr-only">LinkedIn</span>
        <LinkedInIcon className="h-6 w-6" aria-hidden="true" />
      </a>
    </div>
  </div>
);

const About = () => {
  useEffect(() => {
    useModalStore.setState({ currentPage: "about" });
  }, []);

  return (
    <>
      <div className="flex flex-col min-h-screen pt-10 rounded-xl overflow-x-hidden">
        <div className="relative isolate pt-14">
          {/* Team Members Section */}
          <div className="py-12 sm:py-16 lg:pb-20">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
              {/* Header */}
              <div className="text-center text-black">
                <h1 className="text-4xl font-bold sm:text-5xl mb-4">
                  Meet the Team
                </h1>
                <p className="text-xl">
                  The dedicated team of individuals behind the HoagiePlan
                  project.
                </p>
              </div>

              {/* Founding Team Section */}
              <div className="mt-16">
                <h2 className="text-3xl font-bold text-center text-black mb-4">
                  Founding Team
                </h2>
                <p className="text-center text-lg mb-8 text-black">
                  HoagiePlan started as Compass, a COS 333 project. Windsor and
                  George subsequently <br />
                  worked on Compass as a joint Independent Work project.
                </p>
                <div className="flex justify-center gap-4 overflow-auto">
                  {foundingTeam.map((member, index) => (
                    <TeamMemberCard
                      key={member.name}
                      member={member}
                      index={index}
                    />
                  ))}
                </div>
              </div>

              {/* Team Leads Section */}
              <div className="mt-16">
                <h2 className="text-3xl font-bold text-center text-black mb-4">
                  Team Leads
                </h2>
                <p className="text-center text-lg mb-8 text-black">
                  Development for HoagiePlan continued as part of Hoagie. Issac
                  and Gabriel are <br />
                  managing HoagiePlan&apos;s current developers.
                </p>
                <div className="flex flex-wrap justify-center gap-6">
                  {teamLeads.map((member, index) => (
                    <TeamMemberCard
                      key={member.name}
                      member={member}
                      index={foundingTeam.length + index}
                    />
                  ))}
                </div>
              </div>

              {/* Contributors Section */}
              <div className="mt-16">
                <h2 className="text-3xl font-bold text-center text-black mb-4">
                  Contributors
                </h2>
                <p className="text-center text-lg mb-8 text-black">
                  HoagiePlan would not exist without our talented team of
                  Developers.
                </p>
                <ul
                  className="list-disc text-lg text-black max-w-2xl mx-auto space-y-4"
                  // Optionally adjust padding
                >
                  {contributors.map((contributor) => (
                    <li key={contributor.name} className="list-inside">
                      <a
                        href={contributor.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-blue-500 transition-colors"
                      >
                        {contributor.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default About;
