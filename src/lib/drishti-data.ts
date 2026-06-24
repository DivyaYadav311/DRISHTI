// Mock data + types for DRISHTI demo.

export type Signal = {
  id: string;
  source: "IMD" | "RBI" | "PIB" | "BUDGET" | "NEWS";
  title: string;
  urgency: "High" | "Medium" | "Info";
  affected: number;
  segment: string;
  state: string;
  product: string;
  description: string;
  time: string;
};

export const signals: Signal[] = [
  {
    id: "sig-imd-001",
    source: "IMD",
    title: "Weak monsoon forecast for Vidarbha & Marathwada",
    urgency: "High",
    affected: 847,
    segment: "KCC Holders",
    state: "Maharashtra",
    product: "PMFBY Crop Insurance",
    description:
      "IMD reports 38% rainfall deficit projected for next 21 days across Amravati, Yavatmal, Akola, Beed districts.",
    time: "08:42 IST",
  },
  {
    id: "sig-rbi-002",
    source: "RBI",
    title: "Repo rate cut by 25bps to 6.25%",
    urgency: "Medium",
    affected: 12430,
    segment: "Home Loan Accounts",
    state: "All India",
    product: "Asset Refinancing",
    description:
      "MPC unanimously voted for accommodative stance. Floating-rate EMIs eligible for ₹1,800/mo average savings.",
    time: "Yesterday 14:00",
  },
  {
    id: "sig-pib-003",
    source: "PIB",
    title: "PM-KISAN 17th Installment Disbursed",
    urgency: "Info",
    affected: 3200,
    segment: "Jan Dhan Accounts",
    state: "Uttar Pradesh",
    product: "Recurring Deposit Upsell",
    description:
      "₹2,000 credited to 9.4 Cr beneficiaries. Window open for micro-RD enrollment at ₹100/mo with 6.7% interest.",
    time: "07:15 IST",
  },
  {
    id: "sig-bud-004",
    source: "BUDGET",
    title: "MSME Credit Guarantee Scheme Expanded",
    urgency: "Medium",
    affected: 560,
    segment: "Business Accounts",
    state: "Karnataka",
    product: "Emergency Line of Credit",
    description:
      "CGTMSE cover raised to ₹5 Cr from ₹2 Cr. Pre-approved limits available for 6+ month relationship MSMEs.",
    time: "11:08 IST",
  },
];

export type Customer = {
  id: string;
  name: string;
  segment: string;
  state: string;
  hook: string;
  channel: "WhatsApp" | "SMS" | "YONO Push";
  status: "Awaiting Reply" | "In-Thread Chatting" | "Converted" | "RM Escalated";
  product: string;
  value: string;
};

export const customers: Customer[] = [
  { id: "c1", name: "Ramesh Jadhav", segment: "KCC", state: "Maharashtra", hook: "IMD Drought Alert", channel: "WhatsApp", status: "In-Thread Chatting", product: "PMFBY", value: "₹4,200" },
  { id: "c2", name: "Sunita Devi", segment: "Jan Dhan", state: "Uttar Pradesh", hook: "PM-KISAN Credit", channel: "SMS", status: "Awaiting Reply", product: "Micro RD", value: "₹1,200" },
  { id: "c3", name: "Priya Nair", segment: "Home Loan", state: "Maharashtra", hook: "RBI Repo Cut", channel: "YONO Push", status: "Converted", product: "Refi Top-up", value: "₹1.8 L" },
  { id: "c4", name: "Anil Patil", segment: "KCC", state: "Maharashtra", hook: "IMD Drought Alert", channel: "WhatsApp", status: "Converted", product: "PMFBY", value: "₹3,800" },
  { id: "c5", name: "Meena Yadav", segment: "Jan Dhan", state: "Uttar Pradesh", hook: "PM-KISAN Credit", channel: "SMS", status: "In-Thread Chatting", product: "Micro RD", value: "₹600" },
  { id: "c6", name: "Vikram Shetty", segment: "Business", state: "Karnataka", hook: "CGTMSE Expansion", channel: "WhatsApp", status: "RM Escalated", product: "LoC", value: "₹14 L" },
  { id: "c7", name: "Rohit Mehta", segment: "Home Loan", state: "Gujarat", hook: "RBI Repo Cut", channel: "YONO Push", status: "Awaiting Reply", product: "Refi Top-up", value: "₹2.1 L" },
  { id: "c8", name: "Lakshmi Iyer", segment: "Premium", state: "Tamil Nadu", hook: "RBI Repo Cut", channel: "YONO Push", status: "Converted", product: "Refi Top-up", value: "₹3.4 L" },
  { id: "c9", name: "Suresh Kumar", segment: "KCC", state: "Maharashtra", hook: "IMD Drought Alert", channel: "SMS", status: "In-Thread Chatting", product: "PMFBY", value: "₹2,900" },
  { id: "c10", name: "Geeta Bai", segment: "Jan Dhan", state: "Uttar Pradesh", hook: "PM-KISAN Credit", channel: "WhatsApp", status: "Converted", product: "Micro RD", value: "₹1,800" },
];

export type Persona = {
  id: "ramesh" | "sunita" | "priya";
  name: string;
  age: number;
  role: string;
  location: string;
  language: string;
  account: string;
  balance: string;
  creditScore: number;
  channel: "WhatsApp" | "SMS" | "YONO Push";
  trigger: { source: string; title: string };
  vitals: { label: string; value: string }[];
  txns: { date: string; desc: string; amount: string }[];
  thread: ChatTurn[];
};

export type ChatTurn = {
  from: "drishti" | "customer";
  text: string;
  options?: string[];
  meta?: string;
  confirm?: boolean;
};

export const personas: Persona[] = [
  {
    id: "ramesh",
    name: "Ramesh Jadhav",
    age: 52,
    role: "Cotton Farmer",
    location: "Amravati, Maharashtra",
    language: "Marathi",
    account: "KCC",
    balance: "₹1.2 L limit · ₹47,800 drawn",
    creditScore: 712,
    channel: "WhatsApp",
    trigger: { source: "IMD Alert", title: "38% rainfall deficit forecast — Vidarbha" },
    vitals: [
      { label: "Land Holding", value: "4.2 acres" },
      { label: "Last Yield", value: "11 quintal/acre" },
      { label: "Insurance", value: "None active" },
      { label: "Repayment", value: "On-time 23/24 mo" },
    ],
    txns: [
      { date: "12 Jun", desc: "Fertilizer purchase — Krishi Kendra", amount: "−₹8,200" },
      { date: "01 Jun", desc: "KCC interest debit", amount: "−₹412" },
      { date: "28 May", desc: "PM-KISAN credit", amount: "+₹2,000" },
      { date: "10 May", desc: "Seed loan disbursal", amount: "+₹12,000" },
    ],
    thread: [
      {
        from: "drishti",
        text: "नमस्कार रमेशजी 🙏 हवामान विभागाने पुढच्या २१ दिवसांत विदर्भात ३८% कमी पाऊस वर्तवला आहे. तुमच्या ४.२ एकर कापसासाठी PMFBY विमा फक्त ₹४,२०० मध्ये उपलब्ध आहे. भरपाई ₹१.८ लाख पर्यंत.",
        meta: "Marathi · PMFBY hook · token cost ₹0.04",
      },
      {
        from: "customer",
        text: "(awaiting reply)",
        options: ["प्रीमियम किंमत बघा", "नंतर बघू"],
      },
      {
        from: "drishti",
        text: "तुमचा KCC क्रेडिट स्कोर ७१२ आहे — झिरो डाउन-पेमेंट मंजूर. हप्ता KCC मधून आपोआप कापला जाईल. पुष्टी करायची?",
        meta: "Conditional response · structured JSON",
      },
      {
        from: "customer",
        text: "(awaiting reply)",
        options: ["होय, नोंदणी करा ✓", "RM शी बोला"],
      },
      {
        from: "drishti",
        text: "✅ नोंदणी पूर्ण. पॉलिसी क्रमांक PMFBY/MH/2026/8847291. भरपाई दावा रब्बी हंगाम संपल्यावर ३० दिवसांत.",
        confirm: true,
        meta: "Enrollment complete · ₹4,200 debited · Dashboard +1 conversion",
      },
    ],
  },
  {
    id: "sunita",
    name: "Sunita Devi",
    age: 34,
    role: "Rural Weaver",
    location: "Gorakhpur, Uttar Pradesh",
    language: "Hindi",
    account: "Jan Dhan (PMJDY)",
    balance: "₹2,400",
    creditScore: 0,
    channel: "SMS",
    trigger: { source: "PIB Notification", title: "PM-KISAN 17th installment ₹2,000 credited" },
    vitals: [
      { label: "Account Age", value: "3.4 years" },
      { label: "Avg Balance", value: "₹1,860" },
      { label: "RuPay Card", value: "Active" },
      { label: "DBT Linked", value: "Aadhaar ✓" },
    ],
    txns: [
      { date: "Today", desc: "PM-KISAN DBT credit", amount: "+₹2,000" },
      { date: "08 Jun", desc: "Handloom co-op payout", amount: "+₹1,400" },
      { date: "02 Jun", desc: "Mobile recharge", amount: "−₹199" },
      { date: "28 May", desc: "Ration cash withdrawal", amount: "−₹500" },
    ],
    thread: [
      {
        from: "drishti",
        text: "SBI: सुनीता जी, आपके खाते में ₹2,000 PM-KISAN आये हैं ✓ इसे ₹100/माह RD में बदलें — 6.7% ब्याज, 1 साल में ₹1,242 अतिरिक्त। शुरू करें? Reply Y/N",
        meta: "Hindi SMS · 160 char optimized · Micro-RD hook",
      },
      {
        from: "customer",
        text: "(awaiting reply)",
        options: ["Y - शुरू करें", "N - अभी नहीं"],
      },
      {
        from: "drishti",
        text: "SBI: कितनी राशि? Reply: 1=₹100/mo  2=₹200/mo  3=₹500/mo",
        meta: "Structured numeric input",
      },
      {
        from: "customer",
        text: "(awaiting reply)",
        options: ["1 - ₹100/mo", "2 - ₹200/mo"],
      },
      {
        from: "drishti",
        text: "SBI: ✓ RD खुल गई। A/c RD-UP-887721. हर माह 5 तारीख को ऑटो-डेबिट। मेच्योरिटी ₹1,242। SMS HELP for queries.",
        confirm: true,
        meta: "RD opened · ₹100 locked · Dashboard +1 conversion",
      },
    ],
  },
  {
    id: "priya",
    name: "Priya Nair",
    age: 29,
    role: "IT Professional",
    location: "Pune, Maharashtra",
    language: "English",
    account: "Premium Home Loan",
    balance: "Outstanding ₹45,00,000 @ 9.15%",
    creditScore: 798,
    channel: "YONO Push",
    trigger: { source: "RBI MPC", title: "Repo rate cut 25bps → eligible for refinance" },
    vitals: [
      { label: "EMI", value: "₹41,280 /mo" },
      { label: "Tenure Left", value: "17 yr 4 mo" },
      { label: "CIBIL", value: "798" },
      { label: "Salary Credit", value: "₹2.4 L /mo" },
    ],
    txns: [
      { date: "Today", desc: "Salary credit — TCS Ltd", amount: "+₹2,40,000" },
      { date: "05 Jun", desc: "Home loan EMI", amount: "−₹41,280" },
      { date: "02 Jun", desc: "Mutual fund SIP — Axis", amount: "−₹25,000" },
      { date: "28 May", desc: "Credit card payment", amount: "−₹68,400" },
    ],
    thread: [
      {
        from: "drishti",
        text: "RBI cut repo by 25bps today. Your home loan qualifies for refinance at 8.65% — saves ₹1,820/mo, ₹3.71 L over remaining tenure. Top-up of ₹5 L pre-approved.",
        meta: "English YONO card · Refi + Top-up bundle",
      },
      {
        from: "customer",
        text: "(awaiting reply)",
        options: ["See full breakdown", "Decline"],
      },
      {
        from: "drishti",
        text: "Old EMI ₹41,280 → New ₹39,460. Processing fee waived (Premium tier). Top-up disbursal in 4 hrs to A/c ending 8821. e-Sign with Aadhaar?",
        meta: "Structured offer JSON · zero-touch flow",
      },
      {
        from: "customer",
        text: "(awaiting reply)",
        options: ["e-Sign & Confirm ✓", "Talk to RM"],
      },
      {
        from: "drishti",
        text: "✅ Refinance booked. Ref RFI/PUN/2026/44218. ₹5,00,000 top-up credited. New rate effective next billing cycle.",
        confirm: true,
        meta: "Conversion ₹1.8 L value · Dashboard updated",
      },
    ],
  },
];

export const indianStates = [
  "All India",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Delhi",
  "Jammu and Kashmir"
];
export const productTypes = ["All Products", "KCC", "Home Loan", "Jan Dhan", "Business", "Premium"];
