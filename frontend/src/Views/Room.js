import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";

import styles from "./styles.module.scss";

const { alert, confirm, RTCPeerConnection, RTCSessionDescription } = window;
const peerConnection = new RTCPeerConnection();

async function callUser(socket, socketId) {
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(new RTCSessionDescription(offer));

  console.log("[CALL USER]");

  socket.emit("call-user", {
    offer,
    to: socketId,
  });
}

const params = {
  video: {
    width: 240,
    height: 240,
  },
  audio: true,
};

function Room() {
  const [userIds, setUserIds] = useState([]);

  const isAlreadyCalling = useRef(false);
  const isGetCalled = useRef(false);

  const socketRef = useRef(undefined);
  const localRef = useRef(undefined);
  const remoteRef = useRef(undefined);

  useEffect(() => {
    navigator.getUserMedia(
      params,
      (stream) => {
        if (localRef.current) {
          localRef.current.srcObject = stream;
        }

        stream.getTracks().forEach((track) => {
          peerConnection.addTrack(track, stream);
        });
      },
      (error) => {
        console.warn(error.message);
      }
    );

    socketRef.current = io.connect("http://localhost:3015");

    socketRef.current.on("connect", function () {
      console.log("connect", socketRef.current.connected);
    });

    socketRef.current.on("update-user-list", ({ users }) => {
      if (!users) return;
      setUserIds(users);
    });

    socketRef.current.on("remove-user", ({ socketId }) => {
      const usersFiltered = userIds.filter((userId) => userId !== socketId);
      remoteRef.current.srcObject = undefined;
      setUserIds(usersFiltered);
    });

    socketRef.current.on("answer-made", async (data) => {
      if (isAlreadyCalling.current) return;

      const RTCanswer = new RTCSessionDescription(data.answer);
      await peerConnection.setRemoteDescription(RTCanswer);

      callUser(socketRef.current, data.socket);
      isAlreadyCalling.current = true;
    });

    socketRef.current.on("call-rejected", (data) => {
      alert(`User: "Socket: ${data.socket}" rejected your call.`);
    });

    socketRef.current.on("call-made", async (data) => {
      if (isGetCalled.current) {
        const confirmed = confirm(
          `User "Socket: ${data.socket}" wants to call you. Do you accept this call ?`
        );

        if (!confirmed) {
          socketRef.current.emit("reject-call", {
            from: data.socket,
          });

          return;
        }
      }

      if (data.offer) {
        await peerConnection.setRemoteDescription(
          new RTCSessionDescription(data.offer)
        );

        const answer = await peerConnection.createAnswer();

        await peerConnection.setLocalDescription(
          new RTCSessionDescription(answer)
        );

        socketRef.current.emit("make-answer", {
          answer,
          to: data.socket,
        });
      }

      isGetCalled.current = true;
    });

    peerConnection.ontrack = function ({ streams: [stream] }) {
      if (remoteRef.current) {
        remoteRef.current.srcObject = stream;
      }
    };

    peerConnection.connectionstatechange = function (event) {
      console.log("[connectionstatechange]");

      if (peerConnection.connectionState === "connected") {
        console.log("Peers connected!");
      }
    };
  }, []);

  return (
    <div className={styles.Room}>
      <aside className={styles.Aside}>
        {userIds.map((userId) => (
          <button
            key={userId}
            onClick={() => callUser(socketRef.current, userId)}
          >
            {userId}
          </button>
        ))}
      </aside>

      <main className={styles.Main}>
        <video autoPlay muted className={styles.LocalVideo} ref={localRef} />
        <video autoPlay className={styles.RemoteVideo} ref={remoteRef} />
      </main>
    </div>
  );
}

export default Room;
