"use client";
/* eslint-disable @next/next/no-img-element -- Private in-memory QR data must never be sent to a remote optimizer. */
import { useEffect, useState } from 'react';
import { Button } from './ui/controls';
/** Only a newly issued, in-memory code can be printed; never reads stored secrets. */
export default function QrPrintCard({ code, name, branch, arabic }: {
    code: string;
    name: string;
    branch: string;
    arabic: boolean;
}) {
    const [image, setImage] = useState({ code: '', svg: '', error: false }), [attempt, setAttempt] = useState(0), t = (e: string, a: string) => arabic ? a : e;
    useEffect(() => {
        let live = true;
        void import('qrcode').then(q => q.toString(code, { type: 'svg', errorCorrectionLevel: 'M', margin: 4, width: 320 })).then(s => {
            if (live)
                setImage({ code, svg: s, error: false });
        }).catch(() => {
            if (live)
                setImage({ code, svg: '', error: true });
        });
        return () => { live = false; };
    }, [code, attempt]);
    const svg = image.code === code ? image.svg : '', error = image.code === code && image.error;
    function download() {
        const xml = document.implementation.createDocument('http://www.w3.org/2000/svg', 'svg', null), root = xml.documentElement;
        root.setAttribute('width', '400');
        root.setAttribute('height', '440');
        root.setAttribute('viewBox', '0 0 400 440');
        const bg = xml.createElementNS(root.namespaceURI, 'rect');
        bg.setAttribute('width', '400');
        bg.setAttribute('height', '440');
        bg.setAttribute('fill', 'white');
        root.append(bg);
        const qr = new DOMParser().parseFromString(svg, 'image/svg+xml').documentElement;
        qr.setAttribute('x', '40');
        qr.setAttribute('y', '90');
        root.append(xml.importNode(qr, true));
        for (const [value, y] of [[name, 35], [branch, 65], [t('Synthetic staging card', 'بطاقة بيئة اختبار'), 430]] as const) {
            const text = xml.createElementNS(root.namespaceURI, 'text');
            text.setAttribute('x', '200');
            text.setAttribute('y', String(y));
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('font-family', 'sans-serif');
            text.setAttribute('font-size', '16');
            const measure = document.createElement('canvas').getContext('2d');
            if (measure) {
                measure.font = '16px sans-serif';
                if (measure.measureText(value).width > 360) {
                    text.setAttribute('textLength', '360');
                    text.setAttribute('lengthAdjust', 'spacingAndGlyphs');
                }
            }
            text.textContent = value;
            root.append(text);
        }
        const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(xml)], { type: 'image/svg+xml' })), a = document.createElement('a');
        a.href = url;
        a.download = 'academyos-synthetic-card.svg';
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
    return <section className="qr-issued-card"><h3>{name}</h3><p>{branch}</p>{svg ? <><img alt={t('New player QR card', 'بطاقة QR الجديدة للاعب')} width="320" height="320" src={'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)}/><Button onClick={download}>{t('Download printable card', 'تنزيل بطاقة قابلة للطباعة')}</Button></> : error ? <><p role="alert">{t('The card was issued, but its image could not be rendered. Retry this image; do not issue another card.', 'صدرت البطاقة لكن تعذر عرض صورتها. أعد محاولة الصورة؛ لا تُصدر بطاقة أخرى.')}</p><Button onClick={() => setAttempt(n => n + 1)}>{t('Retry QR image', 'إعادة عرض QR')}</Button></> : <p role="status">{t('Rendering issued card…', 'جارٍ عرض البطاقة الصادرة…')}</p>}<details><summary>{t('Card code for manual entry', 'رمز البطاقة للإدخال اليدوي')}</summary><code dir="ltr">{code}</code></details><p>{t('Save this card now. Its code is not stored for later display. If lost, explicitly replace the card; the old copy will stop working.', 'احفظ البطاقة الآن. لا يُخزن الرمز لعرضه لاحقاً. عند فقده استبدل البطاقة صراحةً؛ تتوقف النسخة السابقة.')}</p></section>;
}
