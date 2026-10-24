// Stroke icons drawn inline so they take the text colour. Decorative unless given a label by the caller.
type P = { size?: number };
const base = (size = 18) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
});

export const Flame = ({ size = 22 }: P) => (
  <svg {...base(size)} strokeWidth={1.8}>
    <path d="M12 3c1 3.5 5 5.6 5 10a5 5 0 0 1-10 0c0-2 1-3.4 2-4.4.3 1.6 1.2 2.6 2.2 2.9C10.6 9.2 11 6 12 3Z" />
  </svg>
);
export const Plus = ({ size }: P) => (<svg {...base(size)}><path d="M12 5v14M5 12h14" /></svg>);
export const List = ({ size }: P) => (<svg {...base(size)}><path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" /></svg>);
export const Doc = ({ size }: P) => (<svg {...base(size)}><path d="M7 3h7l5 5v13H7z" /><path d="M14 3v5h5M10 13h6M10 17h6" /></svg>);
export const Cube = ({ size }: P) => (<svg {...base(size)}><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9z" /><path d="m4 7.5 8 4.5 8-4.5M12 12v9" /></svg>);
export const Chat = ({ size }: P) => (<svg {...base(size)}><path d="M4 5h16v11H9l-5 4z" /></svg>);
export const Graph = ({ size }: P) => (<svg {...base(size)}><circle cx="6" cy="6" r="2.5" /><circle cx="18" cy="8" r="2.5" /><circle cx="9" cy="18" r="2.5" /><path d="m8 7.5 7.6 0M7 8.3l1.4 7.3M16.5 10l-5.7 6.5" /></svg>);
export const Spark = ({ size }: P) => (<svg {...base(size)}><circle cx="7" cy="7" r="1.6" /><circle cx="17" cy="6" r="1.6" /><circle cx="12" cy="13" r="1.6" /><circle cx="6" cy="18" r="1.6" /><circle cx="18" cy="17" r="1.6" /></svg>);
export const Clock = ({ size }: P) => (<svg {...base(size)}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></svg>);
export const Download = ({ size }: P) => (<svg {...base(size)}><path d="M12 4v11m0 0-4-4m4 4 4-4M5 19h14" /></svg>);
export const Mic = ({ size }: P) => (<svg {...base(size)}><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></svg>);
export const Send = ({ size }: P) => (<svg {...base(size)}><path d="M5 12h13M13 6l6 6-6 6" /></svg>);
export const Close = ({ size }: P) => (<svg {...base(size)}><path d="M6 6l12 12M18 6 6 18" /></svg>);
export const Chevron = ({ size }: P) => (<svg {...base(size)}><path d="m9 6 6 6-6 6" /></svg>);
export const ChevronLeft = ({ size }: P) => (<svg {...base(size)}><path d="m15 6-6 6 6 6" /></svg>);
export const Speaker = ({ size }: P) => (<svg {...base(size)}><path d="M4 10v4h4l5 4V6L8 10z" /><path d="M16.5 9a4 4 0 0 1 0 6M19 6.5a7.5 7.5 0 0 1 0 11" /></svg>);
export const Mute = ({ size }: P) => (<svg {...base(size)}><path d="M4 10v4h4l5 4V6L8 10z" /><path d="m17 10 4 4m0-4-4 4" /></svg>);
export const Stop = ({ size }: P) => (<svg {...base(size)}><rect x="7" y="7" width="10" height="10" rx="1.5" /></svg>);
export const Upload = ({ size }: P) => (<svg {...base(size)}><path d="M12 16V5m0 0-4 4m4-4 4 4M5 19h14" /></svg>);
