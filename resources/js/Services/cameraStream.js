export const requestCameraStream = ({ facingMode, idealWidth, idealHeight }) => (
    navigator.mediaDevices.getUserMedia({
        video: {
            facingMode,
            width: { ideal: idealWidth },
            height: { ideal: idealHeight },
        },
    })
);

export const stopCameraStream = (stream) => {
    if (!stream) return;
    stream.getTracks().forEach((track) => track.stop());
};

export const getVideoInfo = (video, stream, fallbackFacingMode) => {
    if (!video) return null;
    const track = stream?.getVideoTracks?.()[0];
    const settings = track?.getSettings?.() || {};
    return {
        width: video.videoWidth || settings.width,
        height: video.videoHeight || settings.height,
        deviceWidth: settings.width,
        deviceHeight: settings.height,
        facingMode: settings.facingMode || fallbackFacingMode,
    };
};
