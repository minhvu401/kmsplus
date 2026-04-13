const fs = require('fs');
const file = 'src/app/(main)/documents/[id]/DocumentAttachmentPreviewer.tsx';
let txt = fs.readFileSync(file, 'utf8');

txt = txt.replace(
  'const [previewUrl, setPreviewUrl] = useState<string | null>(null)\n  const [previewTitle, setPreviewTitle] = useState<string>("")',
  'const [previewUrl, setPreviewUrl] = useState<string | null>(null)\n  const [previewTitle, setPreviewTitle] = useState<string>("")\n  const [textContent, setTextContent] = useState<string | null>(null)'
);

txt = txt.replace(
  'const handlePreview = (file: Attachment) => {',
  'const handlePreview = async (file: Attachment) => {\n    setTextContent(null);'
);

txt = txt.replace(
  'if (isOffice) {',
  \if (file.file_name.toLowerCase().endsWith('.txt')) {
      try {
        const response = await fetch(file.file_url);
        if (response.ok) {
          const text = await response.text();
          setTextContent(text);
        } else {
          setTextContent('Error loading text content.');
        }
      } catch(e) {
        setTextContent('Error loading text content.');
      }
      setPreviewUrl(file.file_url);
      setPreviewTitle(file.file_name);
      return;
    }

    if (isOffice) {\
);

txt = txt.replace(
  \else if (file.file_name.toLowerCase().endsWith('.pdf') || file.file_name.toLowerCase().endsWith('.txt')) {\,
  \else if (file.file_name.toLowerCase().endsWith('.pdf')) {\
);

txt = txt.replace(
  '        {previewUrl && isImage(previewTitle) ? (',
  \        {textContent !== null ? (
          <div className="w-full h-full p-6 overflow-auto bg-white">
            <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">{textContent}</pre>
          </div>
        ) : previewUrl && isImage(previewTitle) ? (\
);

txt = txt.replace(
  'onCancel={() => setPreviewUrl(null)}',
  'onCancel={() => { setPreviewUrl(null); setTextContent(null); }}'
);

fs.writeFileSync(file, txt);
console.log('Finished fixing');
