import { useEffect, useRef } from "react";

export default function WebRTCMock({ connected }) {

    const videoRef = useRef(null);

    useEffect(() => {
        if (connected && videoRef.current) {
            videoRef.current.playbackRate = 0.5; // set speed here
        }
    }, [connected]);

    return (
        <div className="bg-stone-700 px-1 pb-1 pt-3 text-left">
            <h2 className="text-lg xl:text-xl text-stone-200"><span className="">Drone Video Stream<sup className={`text-red-500 animate-pulse ${connected ? 'inline-block' : 'hidden'}`}>&#91;LIVE&#93;</sup> <span className="hidden xl:inline-block">&#91; Simulated WebRTC &#93;</span></span></h2>

            {connected ? (
                <video
                    ref={videoRef}
                    src="assets/sample-drone-footage.mp4"
                    autoPlay
                    loop
                    muted
                    className="w-full xl:h-[60vh] grayscale-[60%]"
                />
            ) : (
                <div className="text-stone-300 italic animate-pulse">---Connect to start video stream---</div>
            )}
        </div>
    );
}