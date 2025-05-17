"use client"

import { saveUser } from "@/features/--userSlice";
import { useGetUserQuery, useSaveUserMutation } from "@/features/userSlice";
import { useAppDispatch } from "@/hooks/reduxHooks";
import { useEffect } from "react";

// import {joinRoom} from 'trystero/torrent' // (trystero-torrent.min.js)
// import { useEffect } from "react";



export default function Home() {

  return (
    <div>
      <video controls>
        <source src="https://upload.wikimedia.org/wikipedia/commons/transcoded/c/c0/Big_Buck_Bunny_4K.webm/Big_Buck_Bunny_4K.webm.1080p.vp9.webm" />
      </video>
    </div>
  );
}

