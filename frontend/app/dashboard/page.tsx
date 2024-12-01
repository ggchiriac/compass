"use client";

import { useEffect, FC } from "react";

import SkeletonApp from "@/components/SkeletonApp";
import { useModalStore } from "@/store/modalSlice";
import { Canvas } from "@/app/dashboard/Canvas";
import useUserSlice from "@/store/userSlice";

const Dashboard: FC = () => {
  const profile = useUserSlice((state) => state.profile);

  useEffect(() => {
    useModalStore.setState({ currentPage: "dashboard" });
  });

  return (
    <>
      <main className="flex flex-grow z-10 rounded pt-0.5vh pb-0.5vh pl-0.5vw pr-0.5vw">
        {profile && profile.netId !== "" ? (
          <Canvas profile={profile} columns={2} />
        ) : (
          <div>
            <SkeletonApp />
          </div>
        )}
      </main>
    </>
  );
};

export default Dashboard;
