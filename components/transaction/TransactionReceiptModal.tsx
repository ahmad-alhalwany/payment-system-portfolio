// import React from "react";
import { Transaction } from "@/app/api/transactions";
import { numberToArabicWords } from "@/lib/utils/arabicAmount";
import Image from "next/image";
import { branchesApi } from '@/app/api/branches';
import html2canvas from 'html2canvas';
import React, { useEffect, useState, useRef } from "react";

// import React, { useEffect, useState, useRef } from "react";
// import { Transaction } from "../../api/transactions";
// import { numberToArabicWords } from "../../../lib/utils/arabicAmount";
// import Image from "next/image";
// import { branchesApi } from '@/app/api/branches';
// import html2canvas from 'html2canvas';

interface PrintTransferViewProps {
  transfer: Transaction;
  onClose: () => void;
}

export default function PrintTransferView({ transfer, onClose }: PrintTransferViewProps) {
  // تحديد نوع العملية (إرسال أو استلام)
  const isReceived = transfer.status === "completed";
  const operationType = isReceived ? "استلام" : "إرسال";
  // التاريخ والوقت
  const date = transfer.date?.split("T")[0] || "-";
  const time = transfer.date?.split("T")[1]?.slice(0, 8) || "--:--";
  // المبلغ المستفاد
  const benefit = transfer.benefited_amount ? transfer.benefited_amount.toLocaleString() : "-";
  const amount = transfer.amount ? transfer.amount.toLocaleString() : "-";

  // Helper to display branch name
  const displayBranch = (name: string | null | undefined) => !name || name === '-' ? 'الفرع الرئيسي' : name;
  // Helper to display governorate
  const displayGovernorate = (gov: string | null | undefined) => gov && gov !== '-' ? gov : '';

  const [branchInfo, setBranchInfo] = useState<any>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);
  const [logoLoaded, setLogoLoaded] = useState(false);

  useEffect(() => {
    async function fetchBranch() {
      if (transfer.destination_branch_id) {
        try {
          const data = await branchesApi.getBranch(Number(transfer.destination_branch_id));
          setBranchInfo(data);
        } catch {}
      }
    }
    fetchBranch();
  }, [transfer.destination_branch_id]);

  // ساعات الدوام الافتراضية (يمكنك تعديلها لاحقاً لكل فرع)
  const defaultWorkingHours =
    'الأوقات: الدوام يومياً ماعدا الجمعة من الساعة 10 صباحاً حتى 4:30 عصراً\nللاستعلام واتس اب حصراً';

  // نص عنوان التسليم
  let deliveryAddress = '';
  if (branchInfo) {
    deliveryAddress =
      `${branchInfo.governorate || ''} - ${branchInfo.name || ''} (رمز الفرع: ${branchInfo.branch_id || branchInfo.id})\n` +
      `رقم الفرع المستلم: ${transfer.destination_branch_id || '-'}\n` +
      `${branchInfo.location ? branchInfo.location + '\n' : ''}` +
      `${branchInfo.phone_number ? 'هاتف: ' + branchInfo.phone_number + '\n' : ''}` +
      defaultWorkingHours;
  }

  // دالة مساعدة لاستعادة الأزرار
  const restoreButtons = (buttons: NodeListOf<Element> | null, originalDisplays: string[]) => {
    if (buttons && buttons.length > 0) {
      buttons.forEach((btn: any, index: number) => {
        if (btn && btn.style) {
          btn.style.display = originalDisplays[index] || '';
        }
      });
    }
  };

  // دالة لإنشاء صورة من HTML ومشاركتها
  const generateAndShareImage = async (service: 'whatsapp' | 'telegram') => {
    setIsGeneratingImage(true);
    
    // الانتظار حتى يتم تحميل الشعار
    if (!logoLoaded) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    let receiptElement: HTMLElement | null = null;
    let buttons: NodeListOf<Element> | null = null;
    const originalDisplays: string[] = [];

    try {
      // استخدام ref بدلاً من getElementById
      receiptElement = receiptRef.current;
      if (!receiptElement) {
        alert('لم يتم العثور على عنصر الإيصال');
        setIsGeneratingImage(false);
        return;
      }

      // إنشاء نسخة من العنصر للاستخدام مع html2canvas
      const clone = receiptElement.cloneNode(true) as HTMLElement;
      
      // إزالة الأزرار من النسخة
      const clonedButtons = clone.querySelectorAll('.print\\:hidden');
      clonedButtons.forEach((btn: any) => {
        if (btn.parentNode) {
          btn.parentNode.removeChild(btn);
        }
      });

      // إضافة النسخة مؤقتاً إلى DOM
      clone.style.position = 'fixed';
      clone.style.top = '-9999px';
      clone.style.left = '-9999px';
      clone.style.width = receiptElement.offsetWidth + 'px';
      clone.style.height = receiptElement.offsetHeight + 'px';
      clone.style.visibility = 'visible';
      clone.style.opacity = '1';
      clone.style.backgroundColor = '#ffffff';
      document.body.appendChild(clone);

      // إخفاء الأزرار الأصلية
      buttons = receiptElement.querySelectorAll('.print\\:hidden');
      buttons.forEach((btn: any) => {
        if (btn.style) {
          originalDisplays.push(btn.style.display || '');
          btn.style.display = 'none';
        }
      });

      // الانتظار لتأكد من تحميل جميع الأصول
      await new Promise(resolve => setTimeout(resolve, 500));

      console.log('Starting html2canvas...');

      // خيارات html2canvas محسنة
      const options = {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: true,
        backgroundColor: '#ffffff',
        windowWidth: clone.scrollWidth,
        windowHeight: clone.scrollHeight,
        width: clone.scrollWidth,
        height: clone.scrollHeight,
        onclone: null, // تعطيل onclone لأنه يسبب مشاكل
        foreignObjectRendering: false, // مهم: تعطيل لأنها تسبب مشاكل مع Next.js
      };

      // تحويل HTML إلى canvas
      const canvas = await html2canvas(clone, options as any);
      
      // تنظيف النسخة المؤقتة
      document.body.removeChild(clone);
      
      // استعادة الأزرار
      restoreButtons(buttons, originalDisplays);

      console.log('Canvas created:', canvas.width, 'x', canvas.height);
      console.log('Canvas data URL available:', canvas.toDataURL('image/jpeg').substring(0, 100) + '...');

      // التحقق من أن الكانفاس غير فارغ
      if (canvas.width === 0 || canvas.height === 0) {
        throw new Error('الكانفاس فارغ - لم يتم التقاط أي محتوى');
      }

      // إنشاء رابط مباشر للصورة للتحقق
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      console.log('Image size in KB:', Math.round(dataUrl.length * 0.75) / 1000);

      // عرض معاينة للصورة للتأكد (لأغراض التصحيح)
      if (process.env.NODE_ENV === 'development') {
        const previewWindow = window.open();
        if (previewWindow) {
          previewWindow.document.write(`<img src="${dataUrl}" alt="معاينة الصورة" style="max-width:100%;" />`);
          previewWindow.document.write(`<p>حجم الصورة: ${Math.round(dataUrl.length * 0.75) / 1000} KB</p>`);
          previewWindow.document.write(`<p>أبعاد: ${canvas.width}x${canvas.height}</p>`);
        }
      }

      // تحويل canvas إلى blob
      canvas.toBlob(async (blob) => {
        if (!blob) {
          alert('حدث خطأ أثناء إنشاء الصورة');
          setIsGeneratingImage(false);
          return;
        }

        // التحقق من حجم الصورة
        if (blob.size < 1024) {
          console.error('Image size too small:', blob.size, 'bytes');
          alert('الصورة التي تم إنشاؤها فارغة أو غير صالحة');
          setIsGeneratingImage(false);
          return;
        }

        console.log('Blob created:', blob.size, 'bytes');

        const fileName = `receipt-${transfer.id}-${Date.now()}.jpg`;
        const file = new File([blob], fileName, { type: 'image/jpeg' });

        // محاولة استخدام Web Share API
        if (navigator.share && navigator.canShare) {
          try {
            if (navigator.canShare({ files: [file] })) {
              await navigator.share({
                files: [file],
                title: `إيصال حوالة - ${transfer.id}`,
                text: `إيصال حوالة - مكتب الجاسم للحوالات\nرقم الإشعار: ${transfer.id}`,
              });
              setIsGeneratingImage(false);
              return;
            }
          } catch (shareError: any) {
            if (shareError.name === 'AbortError') {
              setIsGeneratingImage(false);
              return;
            }
            console.log('Web Share API failed:', shareError);
          }
        }

        // Fallback: تحميل الصورة مباشرة
        downloadImage(blob, fileName);
        setIsGeneratingImage(false);

      }, 'image/jpeg', 0.85);

    } catch (error: any) {
      console.error('Error generating image:', error);
      
      // استعادة الأزرار في حالة الخطأ
      restoreButtons(buttons, originalDisplays);
      
      // إزالة أي عناصر مؤقتة
      const tempElements = document.querySelectorAll('[data-temp-clone]');
      tempElements.forEach(el => el.remove());
      
      setIsGeneratingImage(false);
      
      // محاولة بديلة بسيطة
      await tryAlternativeApproach();
    }
  };

  // طريقة بديلة إذا فشلت الطريقة الأولى
  const tryAlternativeApproach = async () => {
    try {
      console.log('Trying alternative approach...');
      
      const receiptElement = receiptRef.current;
      if (!receiptElement) return;
      
      // إنشاء نسخة بسيطة من المحتوى بدون صور معقدة
      const simpleHTML = `
        <div style="width: 800px; padding: 20px; background: white; font-family: Arial, sans-serif; direction: rtl;">
          <h1 style="color: #b45309; text-align: center;">مكتب الجاسم للحوالات</h1>
          <hr style="border: 1px solid #ccc; margin: 20px 0;">
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-bottom: 20px;">
            <div>
              <strong>المصدر:</strong><br>
              ${displayBranch(transfer.sending_branch_name)}
            </div>
            <div>
              <strong>الوجهة:</strong><br>
              ${transfer.destination_branch_id || "-"} - ${displayBranch(transfer.destination_branch_name)}
            </div>
            <div>
              <strong>التاريخ:</strong><br>
              ${date} ${time}
            </div>
          </div>
          <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <h2 style="color: #047857; margin: 0;">${amount} ${transfer.currency === 'USD' ? 'دولار' : transfer.currency}</h2>
            <p style="color: #4b5563; margin: 5px 0;">${numberToArabicWords(transfer.amount)}</p>
          </div>
          <div style="margin-top: 20px;">
            <p><strong>رقم الإشعار:</strong> ${transfer.id}</p>
            <p><strong>المستفيد:</strong> ${transfer.receiver}</p>
            ${transfer.receiver_mobile ? `<p><strong>الجوال:</strong> ${transfer.receiver_mobile}</p>` : ''}
          </div>
        </div>
      `;
      
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = simpleHTML;
      tempDiv.style.position = 'fixed';
      tempDiv.style.top = '-9999px';
      document.body.appendChild(tempDiv);
      
      const canvas = await html2canvas(tempDiv);
      document.body.removeChild(tempDiv);
      
      canvas.toBlob(blob => {
        if (blob) {
          downloadImage(blob, `receipt-simple-${transfer.id}.jpg`);
        }
      }, 'image/jpeg', 0.9);
      
    } catch (error) {
      console.error('Alternative approach failed:', error);
      alert('لم نتمكن من إنشاء الصورة. يرجى استخدام خيار "تنزيل PDF" بدلاً من ذلك.');
    }
  };

  const downloadImage = (blob: Blob, fileName: string) => {
    console.log('Downloading image:', fileName, blob.size, 'bytes');
    
    // خيار 1: تحميل مباشر
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName;
    
    // إضافة معلومات للتحقق
    link.addEventListener('click', () => {
      console.log('Download started for:', fileName);
    });
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // خيار 2: فتح في نافذة جديدة للتحقق
    setTimeout(() => {
      const previewWindow = window.open(blobUrl, '_blank');
      if (previewWindow) {
        setTimeout(() => {
          previewWindow.close();
        }, 3000);
      }
    }, 500);
    
    // تنظيف blob URL بعد التحميل
    setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
      console.log('Blob URL revoked');
    }, 10000);
  };

  return (
    <div
      ref={receiptRef}
      id="receipt"
      className="relative w-[1400px] max-w-full mx-auto p-0 bg-white border border-gray-400 rounded-2xl print:rounded-none print:border-none print:shadow-none shadow-xl overflow-hidden"
      style={{
        minHeight: 480,
        maxHeight: 700,
        minWidth: 900,
        paddingBottom: 16,
        boxSizing: 'border-box',
        // إضافة styles لمساعدة html2canvas
        visibility: 'visible',
        opacity: 1,
      }}
    >
      {/* رأس الإيصال: شعار الشركة واسمها ورقم الإشعار في الزاويتين */}
      <div className="flex items-center justify-between px-8 pt-2 pb-0.5">
        {/* شعار واسم الشركة */}
        <div className="flex items-center gap-4">
          {/* استخدام img عادي بدلاً من Next.js Image لتفادي مشاكل html2canvas */}
          <img 
            src="/payment-system.jpg" 
            alt="شعار الشركة" 
            width={56}
            height={56}
            className="rounded-full border border-yellow-600 bg-white"
            onLoad={() => {
              console.log('Logo image loaded successfully');
              setLogoLoaded(true);
            }}
            onError={(e) => {
              console.error('Failed to load logo:', e);
              // استبدال بصورة بديلة إذا فشلت
              e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTYiIGhlaWdodD0iNTYiIHZpZXdCb3g9IjAgMCA1NiA1NiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iMjgiIGZpbGw9IiNGQ0UwNzgiLz4KPHBhdGggZD0iTTI4IDE4QzMwLjIwOTEgMTggMzIgMTkuNzkwOSAzMiAyMkMzMiAyNC4yMDkxIDMwLjIwOTEgMjYgMjggMjZDMjUuNzkwOSAyNiAyNCAyNC4yMDkxIDI0IDIyQzI0IDE5Ljc5MDkgMjUuNzkwOSAxOCAyOCAxOFoiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik0yMCAzNEgzNlYzNkgyMFYzNFoiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPgo=';
            }}
            crossOrigin="anonymous"
          />
          <div className="text-2xl font-extrabold text-yellow-700 drop-shadow-sm">مكتب الجاسم للحوالات</div>
        </div>
        {/* رقم الإشعار */}
        <div className="text-right flex flex-col items-end max-w-[220px]">
          <span className="font-bold text-xs text-gray-700">رقم الإشعار</span>
          <span className="text-blue-700 font-bold text-sm select-all break-words whitespace-pre-line leading-tight text-left w-full" style={{wordBreak:'break-word'}}>{transfer.id}</span>
        </div>
      </div>
      
      {/* باقي الكود يبقى كما هو بدون تغيير */}
      {/* ... باقي JSX بدون تغيير ... */}
      
      <style jsx global>{`
        @media print {
          body * { visibility: hidden !important; }
          #receipt, #receipt * { 
            visibility: visible !important;
            opacity: 1 !important;
          }
          #receipt {
            position: relative !important;
            left: 0 !important;
            top: 0 !important;
            width: 18cm !important;
            min-width: 0 !important;
            max-width: 18cm !important;
            margin: 1.5cm auto !important;
            background: white !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            page-break-after: avoid !important;
            page-break-before: avoid !important;
            page-break-inside: avoid !important;
          }
          .print\:hidden { display: none !important; }
          @page {
            size: A4 portrait;
            margin: 0;
          }
        }
      `}</style>
    </div>
  );
}