"use client";
import { useEffect, useRef, useState } from 'react';
import { Button, Select } from './ui/controls';
type Detector = {
    detect: (source: HTMLVideoElement) => Promise<{
        rawValue: string;
    }[]>;
};
type DetectorConstructor = {
    new (options: {
        formats: string[];
    }): Detector;
    getSupportedFormats: () => Promise<string[]>;
};
/** Frames stay on device. Parent owns permission scope, save/recovery and pause. */
export default function QrCamera({ enabled, paused, context, arabic, onCode, onStop }: {
    enabled: boolean;
    paused: boolean;
    context: string;
    arabic: boolean;
    onCode: (code: string) => void;
    onStop: () => void;
}) {
    const video = useRef<HTMLVideoElement>(null), consume = useRef(onCode), pause = useRef(paused), stop = useRef(onStop), [error, setError] = useState(''), [devices, setDevices] = useState<MediaDeviceInfo[]>([]), [device, setDevice] = useState('');
    useEffect(() => { consume.current = onCode; pause.current = paused; stop.current = onStop; }, [onCode, paused, onStop]);
    const t = (e: string, a: string) => arabic ? a : e;
    useEffect(() => {
        if (!enabled)
            return;
        let live = true, stream: MediaStream | null = null, frame = 0, timer: ReturnType<typeof setTimeout> | undefined, last = '', emptySince = 0, inFlight = false;
        const element = video.current, canvas = document.createElement('canvas');
        let detector: Detector | null = null, decode: typeof import('jsqr').default | null = null;
        function end() {
            live = false;
            cancelAnimationFrame(frame);
            clearTimeout(timer);
            stream?.getTracks().forEach(track => track.stop());
            if (element)
                element.srcObject = null;
        }
        async function tick() {
            if (!live)
                return;
            if (!pause.current && !inFlight && element && element.readyState >= 2) {
                inFlight = true;
                try {
                    let value: string | undefined;
                    if (detector)
                        value = (await detector.detect(element))[0]?.rawValue;
                    else if (decode && element.videoWidth) {
                        const ratio = Math.min(1, 640 / element.videoWidth);
                        canvas.width = Math.round(element.videoWidth * ratio);
                        canvas.height = Math.round(element.videoHeight * ratio);
                        const ctx = canvas.getContext('2d', { willReadFrequently: true });
                        if (!ctx)
                            throw Error();
                        ctx.drawImage(element, 0, 0, canvas.width, canvas.height);
                        const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
                        value = decode(image.data, image.width, image.height, { inversionAttempts: 'dontInvert' })?.data;
                    }
                    if (live && !pause.current) {
                        if (!value) {
                            if (!emptySince)
                                emptySince = performance.now();
                            if (performance.now() - emptySince > 500)
                                last = '';
                        }
                        else {
                            emptySince = 0;
                            if (value !== last) {
                                last = value;
                                consume.current(value);
                            }
                        }
                    }
                }
                catch {
                    if (live) {
                        setError('decode');
                        stop.current();
                        end();
                    }
                }
                finally {
                    inFlight = false;
                }
            }
            if (live)
                timer = setTimeout(() => { frame = requestAnimationFrame(() => void tick()); }, 120);
        }
        void (async () => {
            setError('');
            try {
                if (!navigator.mediaDevices?.getUserMedia)
                    throw Error('unsupported');
                const result = await navigator.mediaDevices.getUserMedia({ audio: false, video: device ? { deviceId: { exact: device } } : { facingMode: { ideal: 'environment' }, width: { ideal: 640 }, height: { ideal: 480 } } });
                if (!live) {
                    result.getTracks().forEach(track => track.stop());
                    return;
                }
                stream = result;
                if (element) {
                    element.srcObject = result;
                    await element.play();
                }
                const Detector = (window as unknown as {
                    BarcodeDetector?: DetectorConstructor;
                }).BarcodeDetector;
                if (Detector && await Detector.getSupportedFormats().then(f => f.includes('qr_code')).catch(() => false))
                    detector = new Detector({ formats: ['qr_code'] });
                else
                    decode = (await import('jsqr')).default;
                if (!live)
                    return;
                setDevices((await navigator.mediaDevices.enumerateDevices().catch(() => [])).filter(d => d.kind === 'videoinput'));
                void tick();
            }
            catch {
                if (live) {
                    setError('camera');
                    stop.current();
                    end();
                }
            }
        })();
        const hidden = () => {
            if (document.hidden) {
                stop.current();
                end();
            }
        };
        document.addEventListener('visibilitychange', hidden);
        return () => { document.removeEventListener('visibilitychange', hidden); end(); };
    }, [enabled, device, context]);
    return <section className="qr-camera"><video style={{ display: enabled ? undefined : 'none' }} ref={video} autoPlay muted playsInline aria-label={t('Local QR camera preview', 'معاينة كاميرا QR محلية')}/>{enabled && devices.length > 1 && <label>{t('Camera', 'الكاميرا')}<Select value={device} disabled={paused} onChange={e => setDevice(e.target.value)}><option value="">{t('Default camera', 'الكاميرا الافتراضية')}</option>{devices.map((d, i) => <option key={d.deviceId} value={d.deviceId}>{d.label || t('Camera', 'كاميرا') + ' ' + (i + 1)}</option>)}</Select></label>}{error && <p role="alert">{t('Camera or decoder unavailable. Check permission, close other camera apps, or enter the card code.', 'الكاميرا أو القارئ غير متاح. تحقق من الإذن وأغلق التطبيقات الأخرى أو أدخل رمز البطاقة.')}</p>}{enabled && <Button onClick={onStop}>{t('Stop camera', 'إيقاف الكاميرا')}</Button>}<p>{t('Images are processed on this device and are not uploaded or saved.', 'تُعالج الصور على هذا الجهاز ولا تُرفع أو تُحفظ.')}</p></section>;
}
