import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  ShoppingBag,
  ArrowRight,
  Menu,
  ChevronLeft,
  ChevronRight,
  Search,
  ShoppingCart,
  User,
  Activity,
  Award,
  Plus,
  Minus,
  Trash2,
  Clock,
  Heart,
  Mail,
  Lock,
  Bookmark,
  RefreshCw,
  Sliders,
  CheckCircle,
  HelpCircle,
  Camera,
  Layers,
  ShieldCheck
} from "lucide-react";
import { PRODUCTS } from "./products-data.js";
import { Product, Message, SkinProfile, CartItem, CheckoutForm } from "./types.js";

type ViewState = "home" | "portal" | "chat" | "recommendations" | "checkout" | "catalog" | "purchase_completed";

export default function App() {
  // Navigation
  const [view, setView] = useState<ViewState>("home");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeConcernFilter, setActiveConcernFilter] = useState("All");

  // Core Dynamic Applet States
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isAiResponding, setIsAiResponding] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  
  // Skin Analysis Result
  const [profile, setProfile] = useState<SkinProfile | null>(null);
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);

  // Cart
  const [cart, setCart] = useState<CartItem[]>([]);

  // Local storage profile saving state (for the return user resume flow)
  const [savedProfiles, setSavedProfiles] = useState<SkinProfile[]>([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveEmail, setSaveEmail] = useState("");
  const [saveSuccessMessage, setSaveSuccessMessage] = useState("");
  const [hasPreviousLocalSession, setHasPreviousLocalSession] = useState(false);

  // Checkout Form State
  const [checkoutForm, setCheckoutForm] = useState<CheckoutForm>({
    fullName: "",
    streetAddress: "",
    city: "",
    zipCode: "",
    cardNumber: "",
    expiryDate: "",
    cvc: ""
  });
  const [isSubmittingCheckout, setIsSubmittingCheckout] = useState(false);

  // API Warning Fallback State
  const [apiWarning, setApiWarning] = useState<string | null>(null);

  // Chat window automatic scroll anchor
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize and check Local Storage for returning user session
  useEffect(() => {
    const localProfile = localStorage.getItem("aura_skin_profile");
    const localMessages = localStorage.getItem("aura_chat_messages");
    const localSavedProfiles = localStorage.getItem("aura_saved_profiles");

    if (localProfile) {
      setHasPreviousLocalSession(true);
    }
    if (localSavedProfiles) {
      try {
        setSavedProfiles(JSON.parse(localSavedProfiles));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Sync scroll to chat bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAiResponding, isScanning]);

  // Load preset simulated chat messages when starting a fresh session
  const initializeFreshConsultation = () => {
    const welcomeMsg: Message = {
      id: "wel-1",
      sender: "ai",
      text: "Welcome to Aura Science. I've initiated your skin personalization terminal. To formulate your bespoke regimen, could you describe how your skin feels 30 minutes after cleansing? (e.g. skin feels tight on cheeks, gets oiliness on the forehead, or reactiveness to colder weather?)",
      timestamp: new Date()
    };
    setMessages([welcomeMsg]);
    setProfile(null);
    setRecommendedProducts([]);
    setView("chat");
    setApiWarning(null);
  };

  // Resume the existing session stored in local storage
  const resumeExistingSession = () => {
    const localProfile = localStorage.getItem("aura_skin_profile");
    const localMessages = localStorage.getItem("aura_chat_messages");

    if (localProfile) {
      try {
        const parsedProfile = JSON.parse(localProfile) as SkinProfile;
        setProfile(parsedProfile);
        
        // Map products based on parsed concerns
        const matched = PRODUCTS.filter(prod => 
          parsedProfile.concerns.some(concern => 
            prod.skinConcern.toLowerCase() === concern.toLowerCase() || 
            prod.description.toLowerCase().includes(concern.toLowerCase())
          )
        );
        setRecommendedProducts(matched.length > 0 ? matched : PRODUCTS.slice(0, 3));
      } catch (e) {
        console.error(e);
      }
    }

    if (localMessages) {
      try {
        setMessages(JSON.parse(localMessages));
        setView("chat");
      } catch (e) {
        initializeFreshConsultation();
      }
    } else {
      initializeFreshConsultation();
    }
  };

  // Preset quick descriptions for immediate user experience
  const choosePresetSkinDescription = (desc: string) => {
    setChatInput(desc);
  };

  // Helper: Trigger conversational response from server and analyze concerns
  const handleSendChat = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || isAiResponding) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: chatInput,
      timestamp: new Date()
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    const textEntered = chatInput;
    setChatInput("");
    setIsAiResponding(true);

    try {
      // Send chat log to proxy backend
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages })
      });

      if (!response.ok) {
        const errObj = await response.json();
        throw new Error(errObj.error || "Server connection issues");
      }

      const data = await response.json();
      
      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        text: data.text || "I've processed your response. Let me run a molecular dermis analysis to create your recipe formulations now.",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMsg]);
      setIsAiResponding(false);

      // Auto-trigger molecular analysis on substantial inputs
      setTimeout(() => {
        triggerSkinDermalAnalysis(textEntered);
      }, 800);

    } catch (err: any) {
      console.warn("Gemini Server fallback simulation used:", err.message);
      setIsAiResponding(false);
      
      // Dynamic simulated fallback so the experience is gorgeous and functional
      simulateFallbackResponse(textEntered);
    }
  };

  // Simulated fallback for local testing if server credentials missing
  const simulateFallbackResponse = (userInput: string) => {
    setApiWarning(
      "Aura AI server is offline or missing credentials. I have initialized a premium clinical simulation algorithm preset to showcase your workflow."
    );

    const lowercaseInput = userInput.toLowerCase();
    let textResult = "";
    let extractedProfile: SkinProfile = {
      id: `sim-${Date.now()}`,
      skinType: "Combination",
      concerns: ["Dryness", "Sensitivity"],
      hydrationLevel: 32,
      elasticityIndex: "Moderately Compromised",
      phRecommended: "5.5 - 6.0",
      keyIngredientNeeded: "Ceramide NP",
      notes: "Extracted lipid dehydration in the cheek zones with T-zone lipid variability. Recommending lamellar reinforcement."
    };

    if (lowercaseInput.includes("oil") || lowercaseInput.includes("shine") || lowercaseInput.includes("forehead")) {
      textResult = "Your description indicates active sebaceous glands in the T-zone while maintaining tight/delicate skin elsewhere. This is typical of seasonal Combination skin. I'm loading a specialized formulation map targeting both sebum balance and structural hydration.";
      extractedProfile = {
        id: `sim-${Date.now()}`,
        skinType: "Combination",
        concerns: ["Dryness", "Sensitivity", "Fine Lines"],
        hydrationLevel: 42,
        elasticityIndex: "Optimal",
        phRecommended: "5.5",
        keyIngredientNeeded: "Niacinamide & Zinc",
        notes: "Combination profile detected. Stabilizing hydration in dry zones while regulating follicular oil excretion."
      };
    } else if (lowercaseInput.includes("sensitive") || lowercaseInput.includes("red") || lowercaseInput.includes("colder") || lowercaseInput.includes("tight")) {
      textResult = "This suggests a seasonal compromised lipid barrier with reactive vascular triggers. Your skin shows micro-inflammation which locks in dryness. Prescribing lipid infusion and barrier support shields.";
      extractedProfile = {
        id: `sim-${Date.now()}`,
        skinType: "Sensitive",
        concerns: ["Sensitivity", "Dryness", "Transepidermal Loss"],
        hydrationLevel: 28,
        elasticityIndex: "Low",
        phRecommended: "6.0",
        keyIngredientNeeded: "Ceramide NP & Squalane",
        notes: "Severely compromised outer moisture shield. Requiring intense molecular lipid barrier replenishment."
      };
    } else {
      textResult = "An analysis of your cellular profile shows micro-dehydration lines. Our clinical algorithm is selecting active peptides to reinforce and restore cellular elasticity.";
      extractedProfile = {
        id: `sim-${Date.now()}`,
        skinType: "Dry / Dehydrated",
        concerns: ["Dehydration", "Fine Lines"],
        hydrationLevel: 34,
        elasticityIndex: "Moderately Compromised",
        phRecommended: "5.8",
        keyIngredientNeeded: "Micro-Hyaluronic Acid & Peptides",
        notes: "Extracted epidermol loss. Restoring intercellular moisture channels with high-potency Vitamin C."
      };
    }

    setTimeout(() => {
      // Add simulated model reply
      setMessages(prev => [...prev, {
        id: `ai-${Date.now()}`,
        sender: "ai",
        text: textResult,
        timestamp: new Date()
      }]);

      // Trigger scanning simulation
      setIsScanning(true);
      setTimeout(() => {
        setIsScanning(false);
        setProfile(extractedProfile);
        
        // Map corresponding products
        const matched = PRODUCTS.filter(prod => 
          extractedProfile.concerns.some(con => prod.skinConcern.toLowerCase() === con.toLowerCase())
        );
        setRecommendedProducts(matched.length > 0 ? matched : PRODUCTS.slice(0, 3));
        
        // Store session locally
        localStorage.setItem("aura_skin_profile", JSON.stringify(extractedProfile));
        localStorage.setItem("aura_chat_messages", JSON.stringify([
          ...messages,
          { id: `user-sim`, sender: "user", text: userInput, timestamp: new Date() },
          { id: `ai-sim`, sender: "ai", text: textResult, timestamp: new Date() }
        ]));
        setHasPreviousLocalSession(true);

        // Move to recommendations screen
        setView("recommendations");
      }, 2000);

    }, 1500);
  };

  // Real Server Dermal Scan & Analysis
  const triggerSkinDermalAnalysis = async (userDescription: string) => {
    setIsScanning(true);
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skinDescription: userDescription })
      });

      if (!response.ok) {
        throw new Error("Analysis failed");
      }

      const analyzedProfile = await response.json() as SkinProfile;
      setProfile(analyzedProfile);

      // Save key values locally
      localStorage.setItem("aura_skin_profile", JSON.stringify(analyzedProfile));
      localStorage.setItem("aura_chat_messages", JSON.stringify(messages));
      setHasPreviousLocalSession(true);

      // Map corresponding products
      const matched = PRODUCTS.filter(prod => 
        analyzedProfile.concerns.some(c => 
          prod.skinConcern.toLowerCase() === c.toLowerCase() || 
          prod.description.toLowerCase().includes(c.toLowerCase())
        )
      );
      setRecommendedProducts(matched.length > 0 ? matched : PRODUCTS.slice(0, 3));

      setTimeout(() => {
        setIsScanning(false);
        setView("recommendations");
      }, 1500);

    } catch (err) {
      console.warn("Unable to generate live API analyze result. Simulating locally.");
      setIsScanning(false);
      // Fallback is already triggered by parent logic if server fails
    }
  };

  // Save consultation to Account/Email local list
  const handleSaveToAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!saveEmail || !profile) return;

    const newRecord = {
      email: saveEmail,
      profile: profile,
      products: recommendedProducts,
      savedAt: new Date().toLocaleDateString()
    };

    const updated = [...savedProfiles, profile];
    setSavedProfiles(updated);
    localStorage.setItem("aura_saved_profiles", JSON.stringify(updated));

    setSaveSuccessMessage(`Regimen saved successfully to account: ${saveEmail}. Check your inbox for molecular updates!`);
    setSaveEmail("");
    setTimeout(() => {
      setSaveSuccessMessage("");
      setShowSaveModal(false);
    }, 4000);
  };

  // Add Item to Shopping Cart
  const addToCart = (product: Product) => {
    setCart(prev => {
      const itemIndex = prev.findIndex(item => item.product.id === product.id);
      if (itemIndex > -1) {
        const copy = [...prev];
        copy[itemIndex].quantity += 1;
        return copy;
      } else {
        return [...prev, { product, quantity: 1 }];
      }
    });
  };

  // Remove Item or Adjust quantities
  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.product.id === productId) {
          const newQty = item.quantity + delta;
          return { ...item, quantity: newQty < 1 ? 1 : newQty };
        }
        return item;
      });
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  // Grand complete addition mapping recommended regiment to Cart
  const addAllRecommendationsToCart = () => {
    recommendedProducts.forEach(prod => addToCart(prod));
    setView("checkout");
  };

  // Simulated purchase submit
  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingCheckout(true);

    // Simulate validation / bank gateway delay
    setTimeout(() => {
      setIsSubmittingCheckout(false);
      setCart([]); // Clear cart
      setView("purchase_completed");
    }, 2000);
  };

  // Clean local diagnostic data for fresh onboarding start
  const handleClearSession = () => {
    localStorage.removeItem("aura_skin_profile");
    localStorage.removeItem("aura_chat_messages");
    setHasPreviousLocalSession(false);
    initializeFreshConsultation();
  };

  // Compute checkout tallies
  const subtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const tax = subtotal * 0.085;
  const grandTotal = subtotal + tax;

  // Filter products catalog
  const filteredProducts = PRODUCTS.filter(prod => {
    const matchesSearch = prod.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          prod.description.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          prod.activeIngredient.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeConcernFilter === "All") return matchesSearch;
    return matchesSearch && prod.skinConcern.toLowerCase() === activeConcernFilter.toLowerCase();
  });

  return (
    <div id="aura-app" className="min-h-screen flex flex-col bg-[#fbf9f5] text-[#5A3E2D] font-sans antialiased">
      {/* Top Banner Message */}
      <div className="bg-[#8c4b5a] text-[#ffffff] text-center py-2 px-margin-mobile text-xs uppercase tracking-widest font-semibold">
        Complimentary Express Shipping on all Personalized Skin Regimens
      </div>

      {/* Shared Luxury Navigation Bar */}
      <header className="sticky top-0 z-50 bg-[#fbf9f5]/90 backdrop-blur-md border-b border-[#d7c1c4]/35 h-20 transition-all duration-300">
        <div className="flex justify-between items-center h-full px-margin-mobile md:px-margin-desktop w-full max-w-[1440px] mx-auto">
          <div className="flex items-center gap-12">
            <button 
              onClick={() => setView("home")} 
              className="font-serif font-bold text-2xl tracking-normal text-[#5A3E2D] cursor-pointer hover:opacity-80 active:scale-95 transition-all"
            >
              Aura Science
            </button>
            <nav className="hidden md:flex gap-8 items-center">
              <button 
                onClick={() => { setView("catalog"); setActiveConcernFilter("All"); }}
                className={`font-semibold text-xs uppercase tracking-widest transition-colors ${view === "catalog" ? "text-[#8c4b5a] border-b-2 border-[#8c4b5a]" : "text-[#524345] hover:text-[#8c4b5a]"}`}
              >
                Shop
              </button>
              <button 
                onClick={() => setView("portal")}
                className={`font-semibold text-xs uppercase tracking-widest transition-colors ${view === "portal" || view === "chat" || view === "recommendations" ? "text-[#8c4b5a] border-b-2 border-[#8c4b5a]" : "text-[#524345] hover:text-[#8c4b5a]"}`}
              >
                AI Consult
              </button>
              <button 
                onClick={() => { setView("home"); setTimeout(() => document.getElementById("science-block")?.scrollIntoView({ behavior: "smooth" }), 200); }}
                className="font-semibold text-xs uppercase tracking-widest text-[#524345] hover:text-[#8c4b5a] transition-colors"
              >
                Science &amp; Ethics
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-6">
            {/* Minimal Search Trigger */}
            <div className="hidden lg:flex items-center border-b border-[#d7c1c4]/60 pb-1 w-40 focus-within:w-48 transition-all">
              <Search className="w-4 h-4 text-[#847375] mr-2" />
              <input 
                type="text" 
                placeholder="SEARCH INGREDIENTS..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (view !== "catalog") setView("catalog");
                }}
                className="bg-transparent border-none focus:outline-none text-[11px] uppercase tracking-wider p-0 w-full placeholder:text-[#d7c1c4]"
              />
            </div>

            {/* Shopping Cart Button */}
            <button 
              onClick={() => setView("checkout")}
              className="relative p-2 hover:bg-[#efeeea] rounded-full transition-colors group cursor-pointer"
              title="Cart / Checkout"
            >
              <ShoppingCart className="w-5 h-5 text-[#8c4b5a]" />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#8c4b5a] text-white text-[10px] uppercase font-bold w-4 h-4 flex items-center justify-center rounded-full animate-bounce">
                  {cart.reduce((sum, i) => sum + i.quantity, 0)}
                </span>
              )}
            </button>

            {/* Account / Last saved Session Icon */}
            {hasPreviousLocalSession && (
              <button 
                onClick={resumeExistingSession}
                className="p-1.5 border border-[#8c4b5a]/30 rounded-full flex items-center justify-center bg-white shadow-xs group cursor-pointer"
                title="Resume Registered Session"
              >
                <div className="w-2.5 h-2.5 rounded-full bg-[#8c4b5a] animate-pulse"></div>
                <span className="hidden md:inline font-semibold text-[10px] text-[#8c4b5a] uppercase px-1">Resume active</span>
              </button>
            )}

            <button className="md:hidden p-1">
              <Menu className="w-6 h-6 text-[#8c4b5a]" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-grow">
        
        {/* VIEW 1: HOME PAGE */}
        {view === "home" && (
          <div className="fade-in">
            {/* Immersive Hero Landing Banner */}
            <section className="relative min-h-[640px] md:min-h-[800px] flex flex-col justify-center overflow-hidden">
              <div className="absolute inset-0 z-0 bg-[#e4e2de]">
                <img 
                  className="w-full h-full object-cover opacity-85 mix-blend-multiply" 
                  alt="Aura Science Travertine bottles arrangement"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBhw9OOPizZ8qAmQs5t7sjDuUS2Q1TIA4doGx0canksN3_Uc-7kS5q8gVS2905Y24tnQJrZtZ_YhOaRptkJWLI_x10MffnVMSIdvsJaxsZ1sr4Ex1ewfMnkUOQXLjClWMpmkSACtXpyzYNNIWI02RBN7pAKwFMrXg3fqoueXdbmnHtgZQCy-db-UFwI-ZghsXtfwMnYU91bhYw824YXkdShRu8sIjMQHCxhJn5F1e1D4Ox4VMlMS7u7ANR4nH8M-9oFO4Qy50W0Q90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#fbf9f5] via-[#fbf9f5]/5 to-transparent"></div>
              </div>

              <div className="relative z-10 px-margin-mobile md:px-margin-desktop w-full max-w-[1440px] mx-auto py-12">
                <div className="max-w-3xl">
                  <span className="font-sans font-semibold text-xs text-[#8c4b5a] uppercase tracking-[0.25em] mb-4 block">
                    Personalized Skincare Evolution
                  </span>
                  <h1 className="font-serif font-bold text-4xl sm:text-5xl md:text-7xl leading-[1.1] mb-6 text-[#5A3E2D]">
                    Precision Science. <br />
                    <span className="italic font-normal text-[#8c4b5a]">Effortless Luxury.</span>
                  </h1>
                  <p className="font-sans text-base md:text-lg text-[#524345] max-w-lg mb-8 leading-relaxed">
                    Beyond the surface. Aura Science leverages proprietary AI and clinical datasets to formulate your bespoke skincare regimen in real-time.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button 
                      onClick={() => setView("portal")}
                      className="bg-[#8c4b5a] text-white px-8 py-4 font-semibold text-xs uppercase tracking-widest hover:bg-[#6f3442] transition-colors rounded-xs shadow-md active:scale-98"
                    >
                      Find Your Routine
                    </button>
                    <button 
                      onClick={() => { setView("catalog"); setActiveConcernFilter("All"); }}
                      className="border border-[#847375] text-[#5A3E2D] px-8 py-4 font-semibold text-xs uppercase tracking-widest hover:bg-[#efeeea] transition-all rounded-xs active:scale-98"
                    >
                      View The Collection
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Three Step Diagnostic process (How it Works) */}
            <section id="science-block" className="py-24 bg-white border-y border-[#d7c1c4]/20">
              <div className="px-margin-mobile md:px-margin-desktop w-full max-w-[1440px] mx-auto">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8">
                  <div className="max-w-xl">
                    <h2 className="font-serif font-semibold text-3xl md:text-4xl mb-4 text-[#5A3E2D]">
                      The Intelligence Behind Your Glow
                    </h2>
                    <p className="font-sans text-[#524345]">
                      Our three-step diagnostic process eliminates the guesswork, delivering biological formulas tailored to your unique skin biology.
                    </p>
                  </div>
                  <div>
                    <button 
                      onClick={() => setView("portal")}
                      className="font-sans font-semibold text-xs uppercase tracking-widest text-[#8c4b5a] border-b border-[#8c4b5a]/30 pb-1 hover:border-[#8c4b5a] transition-all"
                    >
                      Begin diagnostic consultation
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Step 1 */}
                  <div className="bg-[#fbf9f5] rounded-lg p-6 border border-[#d7c1c4]/25 hover:shadow-md transition-shadow group">
                    <div className="aspect-video bg-[#efeeea] overflow-hidden rounded-md mb-6 relative">
                      <img 
                        className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700" 
                        alt="Onboarding portraits"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuBJnKy4upU8GAJzoK8Il-L5y6wIKn5-dR1JVLMhLnGLB90ghNH2b74IQOesNuH1Dl05VQaN3NoUX_R4y85A68Yq_9bAgX9E-xmeUVuRaHNxlxx4BYvvfO2dHFE9zzscN4lvRsYj_GJsE7LK0Zt1L2hwJTjHH3Axhmx6WR21wM0MIp8mtz3Bahzxdk7WdDrMXPMBjtRBuq7bRyFAbWPfLjLo8j8PTyOx0gbabyeR0PGa7SBoo_YwTpTeX4os2765aSwL5Y9TZG1UB6U"
                      />
                      <span className="absolute top-4 left-4 w-8 h-8 rounded-full bg-white flex items-center justify-center font-bold text-xs text-[#8c4b5a] border border-[#d7c1c4]/20 shadow-xs">01</span>
                    </div>
                    <h3 className="font-serif font-semibold text-xl mb-2 text-[#5A3E2D]">Interactive AI Chat</h3>
                    <p className="text-sm text-[#524345] leading-relaxed">
                      Describe your concerns, seasonal environment, and lifestyle answers to our intelligent skincare interface.
                    </p>
                  </div>

                  {/* Step 2 */}
                  <div className="bg-[#fbf9f5] rounded-lg p-6 border border-[#d7c1c4]/25 hover:shadow-md transition-shadow group">
                    <div className="aspect-video bg-[#efeeea] overflow-hidden rounded-md mb-6 relative">
                      <img 
                        className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700" 
                        alt="Microscopic analytical graphics"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuCgJ_qLUlruorSbvnBoP7Pp6CNV4yi27i18jVPfSyVOFuK6z_C9SgAPEaPMwVmL8CbEdpNPdK1rZn_FqNHh1YERv3UFBkgrXhd0jIdkQzYfHezsT_8mL7-P7NrktchTxt3HnSkiqPjyeVMtQRy-U-4vijg8XcLUDux74_1t1_H0hjOZY8r73rf1QcLTAtKwVZTDRDQFaLV-XB8YPPJaOeKD0X9b2epmCv07MyIKB2g8vhVSF4BvTEaEqxaXrkX0_6rBa7_BoVUaK10"
                      />
                      <span className="absolute top-4 left-4 w-8 h-8 rounded-full bg-white flex items-center justify-center font-bold text-xs text-[#8c4b5a] border border-[#d7c1c4]/20 shadow-xs">02</span>
                    </div>
                    <h3 className="font-serif font-semibold text-xl mb-2 text-[#5A3E2D]">Data-Driven Analysis</h3>
                    <p className="text-sm text-[#524345] leading-relaxed">
                      Our algorithm cross-references your input parameters with over 5,000 biological actives to extract precise molecular fits.
                    </p>
                  </div>

                  {/* Step 3 */}
                  <div className="bg-[#fbf9f5] rounded-lg p-6 border border-[#d7c1c4]/25 hover:shadow-md transition-shadow group">
                    <div className="aspect-video bg-[#efeeea] overflow-hidden rounded-md mb-6 relative">
                      <img 
                        className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700" 
                        alt="Product delivery bottles"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuBU3NdXSrFPQA4Gkg8y4FwKVXzZbNdwF_0rBrjys5By34vwzShEEBQ7vLV2ApdlFDrQuQu-dtFVb_q24zmTWSaYEiovgR8g0U6zhAG7wwjI3kGxuVHsj9OxJCeCKnJIpYrrAcbLRWfq-xUWAWu3cesS3jl128s6GjgL_aKavujnpzz4GCnip9OTkOSkv0fSWBhno-tdN_v_mg3u03KfodDhNxYhM_V_M9dTOlpOaWgJhzSYARdni1atC6JVNPuOqT9VW4trGBjx3Io"
                      />
                      <span className="absolute top-4 left-4 w-8 h-8 rounded-full bg-white flex items-center justify-center font-bold text-xs text-[#8c4b5a] border border-[#d7c1c4]/20 shadow-xs">03</span>
                    </div>
                    <h3 className="font-serif font-semibold text-xl mb-2 text-[#5A3E2D]">Bespoke Regimen</h3>
                    <p className="text-sm text-[#524345] leading-relaxed">
                      Receive your curated sequence with specialized instructions. Dermal efficacy meets a purely indulgent luxury routine.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Featured Product Bento Section */}
            <section className="py-20 px-margin-mobile md:px-margin-desktop w-full max-w-[1440px] mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Large Bento Card */}
                <div className="md:col-span-8 bg-[#efeeea] rounded-lg overflow-hidden flex flex-col md:flex-row relative group border border-[#d7c1c4]/20">
                  <div className="flex-1 p-8 md:p-12 flex flex-col justify-center z-10">
                    <span className="text-[#8c4b5a] font-semibold text-[10px] uppercase tracking-widest mb-3 block">Featured Innovation</span>
                    <h3 className="font-serif font-bold text-2xl md:text-4xl mb-4 text-[#5A3E2D]">The Luminance Serum</h3>
                    <p className="text-sm text-[#524345] mb-8 max-w-sm leading-relaxed">
                      A high-potency concentrate of stabilized Vitamin C and botanical peptides formulated to restore structural dermal vitality.
                    </p>
                    <button 
                      onClick={() => { setView("catalog"); setSearchQuery("Luminous"); }}
                      className="w-fit text-xs font-semibold uppercase tracking-wider text-[#5A3E2D] border-b border-[#5A3E2D] pb-1 hover:text-[#8c4b5a] hover:border-[#8c4b5a] transition-all"
                    >
                      Shop Luminance
                    </button>
                  </div>
                  <div className="flex-1 h-[300px] md:h-auto overflow-hidden">
                    <img 
                      className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-1000" 
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuDUB3pF1HdFZWvCfQfgDeecDViX4gc9_75BnU2Ubi-ZbgQGByj7ozHCBgt2JjMuml86bDXOJLhv9S9uwimvEZVBUix4rv7ATINrf6nSLrT0_zRWLtNLgbjEEvxeMpo47P1QmspiW9Eo4LlNORbOkCpSniIuJ37nQWltdTNS4H6nb2Xc3XW74QUm7WHWlhob0mX3Xaw99vFFG9N6B6C1gAVo8DPi30EM_hegVVdFSL8DCK7Liu2KfAlg5pGTo_esHCdW4T2wv2uUqQc" 
                      alt="Gold skincare dropper dropper macro"
                    />
                  </div>
                </div>

                {/* Small Bento Card */}
                <div className="md:col-span-4 bg-[#cae8ef]/45 rounded-lg border border-[#cae8ef] p-10 flex flex-col justify-between group">
                  <div>
                    <h3 className="font-serif font-bold text-2xl text-[#021f24] mb-3">Clinically Proven</h3>
                    <p className="text-sm text-[#4e696f] leading-relaxed">
                      98% of clinical participants reported fully stabilized skin barrier retention and improved elasticity after 14 days of sequential usage.
                    </p>
                  </div>
                  <div className="text-7xl font-sans font-bold text-[#8c4b5a]/10 select-none group-hover:text-[#8c4b5a]/25 transition-colors mt-6">
                    98%
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* VIEW 2: INTERACTIVE CONSULT TERMINAL PORTAL */}
        {view === "portal" && (
          <div className="py-16 md:py-24 max-w-[1440px] mx-auto px-margin-mobile md:px-margin-desktop relative overflow-hidden fade-in">
            {/* Background floating graphical bubbles */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
              <div className="absolute top-[-10%] right-[-5%] w-[450px] h-[450px] bg-[#df91a2]/15 rounded-full blur-[100px]"></div>
              <div className="absolute bottom-[-5%] left-[5%] w-[350px] h-[350px] bg-[#cae8ef]/30 rounded-full blur-[90px]"></div>
            </div>

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#efeeea] border border-[#d7c1c4]/45 rounded-full mb-6">
                  <span className="material-symbols-outlined text-sm text-[#8c4b5a]" style={{fontVariationSettings: "'FILL' 1"}}>auto_awesome</span>
                  <span className="font-semibold text-[10px] uppercase tracking-widest text-[#524345]">Clinical Precision</span>
                </div>
                <h1 className="font-serif font-bold text-3xl sm:text-4xl md:text-6xl leading-[1.12] mb-6 text-[#5A3E2D]">
                  Your Skin's <br />
                  <span className="italic font-normal text-[#8c4b5a]">Molecular Portrait.</span>
                </h1>
                <p className="text-[#524345] mb-10 text-base md:text-lg leading-relaxed max-w-lg">
                  Our AI-driven consultation analyzes your unique dermatological concerns to curate a high-performance clinical regimen, balancing molecular science with sensory luxury.
                </p>

                {/* Sub-routing decision parameters */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <button 
                    onClick={initializeFreshConsultation}
                    className="flex-1 bg-[#8c4b5a] hover:bg-[#6f3442] text-white px-8 py-5 uppercase tracking-wider font-semibold text-xs flex items-center justify-center gap-2 rounded-xs shadow-md transition-colors"
                  >
                    Start New Consultation
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  {hasPreviousLocalSession ? (
                    <button 
                      onClick={resumeExistingSession}
                      className="flex-1 border-2 border-[#8c4b5a] text-[#8c4b5a] hover:bg-[#ffccd5]/20 px-8 py-5 uppercase tracking-wider font-semibold text-xs rounded-xs transition-all flex items-center justify-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4 animate-spin-slow" />
                      Resume Previous Session
                    </button>
                  ) : (
                    <button 
                      onClick={() => {
                        // Directly simulate a fast generic analysis to let them browse
                        choosePresetSkinDescription("Classic combination: T-zone shine combined with tight cheeks.");
                        initializeFreshConsultation();
                      }}
                      className="flex-1 border border-[#847375] hover:bg-[#efeeea] text-[#5A3E2D] px-8 py-5 uppercase tracking-wider font-semibold text-xs rounded-xs transition-all"
                    >
                      Use Demo Profile
                    </button>
                  )}
                </div>

                {hasPreviousLocalSession && (
                  <div className="mt-4 flex items-center gap-3">
                    <button 
                      onClick={handleClearSession}
                      className="text-[#847375] hover:text-[#ba1a1a] text-xs underline tracking-wider cursor-pointer"
                    >
                      Reset &amp; Clear Stored local cache
                    </button>
                  </div>
                )}

                <div className="mt-12 flex items-center gap-4 opacity-75">
                  <div className="flex -space-x-3">
                    <div className="w-9 h-9 rounded-full border-2 border-[#fbf9f5] bg-[#df91a2]"></div>
                    <div className="w-9 h-9 rounded-full border-2 border-[#fbf9f5] bg-[#cae8ef]"></div>
                    <div className="w-9 h-9 rounded-full border-2 border-[#fbf9f5] bg-[#ffd9df]"></div>
                  </div>
                  <p className="text-xs font-semibold text-[#524345]">Trusted by 12,000+ Skin Profiles</p>
                </div>
              </div>

              {/* Graphical Card Visual representation of Aura Skincare bottles */}
              <div className="relative flex justify-center lg:justify-end">
                <div className="relative w-full max-w-sm aspect-[4/5] bg-white rounded-lg border border-[#d7c1c4]/40 overflow-hidden shadow-2xl flex flex-col justify-between">
                  <img 
                    alt="Clinical Skincare bottles" 
                    className="absolute inset-0 w-full h-full object-cover mix-blend-multiply opacity-50 z-0"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuB-5Xnyb5EZrwAA2lH1UVVb3LbSeQ-IDm-ilF9_sZEL2JmlXS2wmzujuAqxaTKKnr2FvY4nwMSRLPipwaOEsHh7iK-5CMm0CuNOR6zcW_THcyJGg0mNYZqASmjo1DiLcgLA9P-Atm7HP36m4xz1JEnX9Uf5iIBdqIsZjThXwao5O6DBU_mg8EHcDvniX-trhKwjcvf-IeqURt9UF3pTX_I_10D65r-d3bBBqvlharRqrA65g1_G_GA0mIUMqcJtcyfjfzHev8JjDdo"
                  />

                  {/* Atmospheric Floating Data points */}
                  <div className="relative z-10 p-6 flex flex-col justify-between h-full">
                    <div className="self-end bg-white/95 border border-[#d7c1c4]/45 rounded-md p-3 shadow-xs animate-pulse text-right">
                      <p className="text-[9px] uppercase tracking-wider text-[#8c4b5a] font-bold">Hydration Index</p>
                      <p className="font-serif font-semibold text-[#5A3E2D] text-lg">84.2% Optimal</p>
                    </div>

                    <div className="self-start bg-[#5A3E2D] text-[#fbf9f5] p-3 rounded-md shadow-lg border border-[#847375]/30">
                      <p className="text-[9px] uppercase tracking-wider text-[#df91a2] font-semibold">AI Recommendation</p>
                      <p className="font-serif font-light text-sm italic">"The Luminous Matrix Complex"</p>
                    </div>

                    <div className="mt-auto">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-[1px] bg-[#8c4b5a]"></div>
                        <span className="font-sans font-semibold text-[10px] uppercase tracking-widest text-[#524345]">The Science of Glow</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: ONBOARDING ACTIVE CONSULTATION CHAT */}
        {view === "chat" && (
          <div className="flex flex-col md:flex-row max-w-[1440px] mx-auto min-h-[calc(100vh-120px)] fade-in">
            
            {/* Left Sidebar showing live status variables */}
            <aside className="w-full md:w-80 border-r border-[#d7c1c4]/20 p-6 flex flex-col gap-6 bg-[#f5f3ef]/50">
              <div>
                <h2 className="font-serif font-semibold text-2xl text-[#5A3E2D] mb-1">Aura AI</h2>
                <p className="text-xs text-[#524345] leading-relaxed">
                  Your personalized clinical skincare consultant. Powered by advanced dermatological algorithms.
                </p>
              </div>

              {/* Simulation API Alert if applicable */}
              {apiWarning && (
                <div className="p-3 bg-[#cae8ef]/60 border border-[#cae8ef] rounded-md text-xs text-[#021f24] leading-relaxed">
                  <div className="font-bold mb-1 flex items-center gap-1">
                    <HelpCircle className="w-3.5 h-3.5 text-[#8c4b5a]" /> Tutorial Note
                  </div>
                  {apiWarning}
                </div>
              )}

              {/* Status Indicators representing active Dermal Scan progress */}
              <div className="space-y-4">
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#8c4b5a] block">Live Analysis parameters</span>
                
                <div className="bg-white border border-[#d7c1c4]/25 rounded-md p-4 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#847375]">Dermal Status</span>
                    <span className={`px-2 py-0.5 text-[9px] uppercase font-bold tracking-wide rounded-sm ${isScanning ? "bg-[#ffd9df] text-[#8c4b5a] animate-pulse" : "bg-[#efeeea] text-[#524345]"}`}>
                      {isScanning ? "Scanning..." : "Awaiting Input"}
                    </span>
                  </div>

                  <div className="w-full h-1 bg-[#efeeea] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#8c4b5a] transition-all duration-300"
                      style={{ width: isScanning ? "75%" : isAiResponding ? "35%" : "10%" }}
                    ></div>
                  </div>

                  <div className="text-[11px] text-[#524345] leading-relaxed space-y-2 pt-1 border-t border-[#d7c1c4]/15">
                    <p className="font-semibold text-xs">Extraction criteria:</p>
                    <ul className="space-y-1 list-disc list-inside text-xs text-[#847375]">
                      <li>Hydration coefficient</li>
                      <li>Lipid barrier density</li>
                      <li>Acne &amp; vascular reactivity</li>
                    </ul>
                  </div>
                </div>

                {/* Preset Skin Profile selectors for testing convenience */}
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-[#8c4b5a] block">Quick Presets</span>
                  <div className="flex flex-col gap-1.5">
                    <button 
                      onClick={() => choosePresetSkinDescription("My skin feels very dry, reactive, and tight on colder winds. No acne but quite sensitive.")}
                      className="text-left w-full p-2 bg-white text-xs border border-[#d7c1c4]/25 hover:border-[#8c4b5a] rounded-sm transition-colors cursor-pointer"
                    >
                      "Dry &amp; Sensitive"
                    </button>
                    <button 
                      onClick={() => choosePresetSkinDescription("I have an oily forehead and nose with occasional breakouts, but my cheeks get flaky after washing.")}
                      className="text-left w-full p-2 bg-white text-xs border border-[#d7c1c4]/25 hover:border-[#8c4b5a] rounded-sm transition-colors cursor-pointer"
                    >
                      "Combination Skin"
                    </button>
                    <button 
                      onClick={() => choosePresetSkinDescription("Looking to target micro-dehydration, loss of bounce, and fine lines around my eyes.")}
                      className="text-left w-full p-2 bg-white text-xs border border-[#d7c1c4]/25 hover:border-[#8c4b5a] rounded-sm transition-colors cursor-pointer"
                    >
                      "Aging &amp; Dehydration"
                    </button>
                  </div>
                </div>
              </div>

              {/* Aesthetic glass still life picture in rail */}
              <div className="mt-auto hidden md:block border-t border-[#d7c1c4]/25 pt-4">
                <img 
                  alt="Aura Glass Serum Still" 
                  className="w-full h-32 object-cover rounded-md grayscale-15 opacity-65"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBBz6Ro5xkHboA4O0g-xvZlaqb4xwn46W4TgSGqbiHrdELWQQoI2RUw6Z7D2lDhSx4HQPqykrVOlclJGdn_sKqpLZA8O-ZBJDLJNIJRjOVDeSECWLGga-habTg2yGBcDAC-PrSPWhFh6kPRiO4GiZNs-rOJ8EzR1Wjeq4EtfsyYlIJByGOHO0TjztvSpvROKDMahCnN5GF9n1RNWeorgvlcQV5WkNJHH_7G9KCYSYhM9zjbe0ktzoCnrKxnl6FkEn-FqUFh2BsNVo0"
                />
              </div>
            </aside>

            {/* Generative Chat Dialog Arena */}
            <section className="flex-1 flex flex-col h-[calc(100vh-120px)] bg-white">
              
              {/* Chat Log Overflow Box */}
              <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-6">
                
                {messages.map((m) => (
                  <div 
                    key={m.id} 
                    className={`flex gap-4 max-w-2xl ${m.sender === "user" ? "ml-auto flex-row-reverse text-right" : ""}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${m.sender === "user" ? "bg-[#cae8ef]/35 border-[#cae8ef] text-[#021f24]" : "bg-[#ffd9df]/30 border-[#ffd9df] text-[#8c4b5a]"}`}>
                      {m.sender === "user" ? <User className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
                    </div>

                    <div className="space-y-1 w-full">
                      <div className={`p-5 rounded-lg text-[#5A3E2D] text-sm leading-relaxed ${m.sender === "user" ? "bg-[#cae8ef]/15 text-left border border-[#cae8ef]/20" : "bg-[#ffd9df]/10 text-left border border-[#ffd9df]/20"}`}>
                        {m.text}
                      </div>
                      <span className="text-[9px] uppercase tracking-widest text-[#847375] block px-1">
                        {m.sender === "user" ? "You" : "Aura AI"}
                      </span>
                    </div>
                  </div>
                ))}

                {/* Live Analysis Transition / Scanning molecules progress */}
                {isScanning && (
                  <div className="flex gap-4 max-w-xl bg-[#ffd9df]/20 border border-[#ffd9df]/40 rounded-lg p-6 animate-pulse">
                    <div className="w-8 h-8 rounded-full bg-[#8c4b5a] flex items-center justify-center text-white shrink-0">
                      <RefreshCw className="w-4 h-4 animate-spin-slow" />
                    </div>
                    <div className="space-y-3 w-full">
                      <div className="font-mono text-xs uppercase tracking-[0.2em] text-[#8c4b5a] font-bold">
                        AI Scanning Moisture Barrier...
                      </div>
                      <p className="text-xs text-[#524345]">
                        Cross-checking epidermis diagnostic pointers against bioactive clinical molecules...
                      </p>
                      <div className="w-full bg-white h-1.5 rounded-full overflow-hidden">
                        <div className="h-full bg-[#8c4b5a] animate-infinite-loading"></div>
                      </div>
                    </div>
                  </div>
                )}

                {isAiResponding && (
                  <div className="flex gap-4 max-w-xl p-3 text-xs text-[#847375] italic animate-pulse">
                    <span>Aura AI is formulating a clinical assessment...</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input form area */}
              <div className="p-6 border-t border-[#d7c1c4]/20 bg-[#fbf9f5]">
                <form onSubmit={handleSendChat} className="max-w-4xl mx-auto space-y-4">
                  <div className="relative flex items-center bg-white border border-[#d7c1c4]/45 rounded-full shadow-xs px-6 py-2 group focus-within:border-[#8c4b5a]/80 transition-all">
                    
                    <textarea 
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendChat();
                        }
                      }}
                      placeholder="Describe your skin cells context (oiliness, reactiveness, seasonal stiffness)..." 
                      rows={1}
                      className="w-full bg-transparent border-none text-[#5A3E2D] font-sans text-sm focus:outline-none focus:ring-0 resize-none pr-12 min-h-[36px] flex items-center py-2"
                    />

                    <button 
                      type="submit" 
                      disabled={!chatInput.trim() || isAiResponding}
                      className="absolute right-3 bg-[#8c4b5a] hover:bg-[#6f3442] disabled:opacity-40 text-white w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-md shadow-[#8c4b5a]/10"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex flex-wrap justify-between items-center gap-3">
                    <div className="flex gap-4">
                      {/* Interactive Secondary inputs */}
                      <button 
                        type="button" 
                        onClick={() => {
                          const demoAnswers = [
                            "Skin feels highly tight 30 mins after washing.",
                            "T-zone gets glossy after lunch, cheeks look flaky.",
                            "I have constant redness around my nose wings seasonally."
                          ];
                          const randomAnswer = demoAnswers[Math.floor(Math.random() * demoAnswers.length)];
                          setChatInput(randomAnswer);
                        }}
                        className="text-[11px] font-semibold text-[#847375] hover:text-[#8c4b5a] uppercase tracking-widest flex items-center gap-1 bg-white border border-[#d7c1c4]/15 px-3 py-1.5 rounded-full shadow-2xs cursor-pointer"
                      >
                        <Sliders className="w-3.5 h-3.5 text-[#8c4b5a]" /> Populate Dummy Text
                      </button>

                      {/* Photo Upload capability */}
                      <button 
                        type="button" 
                        onClick={() => {
                          alert("Aura Dermal Camera trigger: Frame scanning is pending. Please describe your skin texture in written formats below.");
                        }}
                        className="text-[11px] font-semibold text-[#847375] hover:text-[#8c4b5a] uppercase tracking-widest flex items-center gap-1 bg-white border border-[#d7c1c4]/15 px-3 py-1.5 rounded-full shadow-2xs cursor-pointer"
                      >
                        <Camera className="w-3.5 h-3.5 text-[#8c4b5a]" /> Upload Dermal Photo
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (messages.length > 1) {
                          // Trigger analyzing on last message content
                          const lastUserMsg = [...messages].reverse().find(m => m.sender === "user")?.text || "Dryness and sensitivity in my cold climate cheeks.";
                          triggerSkinDermalAnalysis(lastUserMsg);
                        } else {
                          triggerSkinDermalAnalysis("Dryness, sensitivity, and oiliness on standard forehead zones.");
                        }
                      }}
                      className="text-xs font-bold text-white bg-[#8c4b5a] px-6 py-2.5 uppercase tracking-wider hover:bg-[#6f3442] rounded-full flex items-center gap-1 shadow-md cursor-pointer"
                    >
                      <Layers className="w-4 h-4 animate-pulse" /> Trigger diagnostic scan
                    </button>
                  </div>
                </form>
              </div>
            </section>
          </div>
        )}

        {/* VIEW 4: DYNAMIC RECOMMENDATIONS RESULT REGIMEN PAGE */}
        {view === "recommendations" && (
          <div className="max-w-[1440px] mx-auto px-margin-mobile md:px-margin-desktop py-12 md:py-20 fade-in">
            
            {/* Header intro of analyzed profile */}
            <header className="mb-12 max-w-3xl">
              <span className="text-[#8c4b5a] font-bold text-xs uppercase tracking-widest block mb-3">Diagnostic Analysis Complete</span>
              <h1 className="font-serif font-bold text-3xl sm:text-5xl text-[#5A3E2D] mb-4">Your Bespoke Regimen</h1>
              <p className="text-[#524345] text-base md:text-lg">
                Our clinical algorithms have formulated a specific sequence of biological actives designed to match your extracted Cellular Skin profile.
              </p>
            </header>

            {/* Layout Grid Split between Extracted Profile on Left, Products on Right */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Dermal parameters Side Tally */}
              <aside className="lg:col-span-4 bg-[#f5f3ef] border border-[#d7c1c4]/45 p-6 rounded-lg space-y-6 lg:sticky lg:top-28">
                <div className="flex items-center gap-3 border-b border-[#d7c1c4]/30 pb-4">
                  <Activity className="w-5 h-5 text-[#8c4b5a]" />
                  <h2 className="font-serif font-semibold text-lg text-[#5A3E2D] uppercase tracking-wide">Dermatological Profile</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#847375] tracking-widest block mb-2">My Extracted Skin Type</span>
                    <span className="px-3 py-1 bg-white border border-[#d7c1c4]/20 rounded-md font-semibold text-xs text-[#8c4b5a]">
                      {profile?.skinType || "Combination Sensitive"}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#847375] tracking-widest block mb-2">Live Moisture Coefficient</span>
                    <div className="flex justify-between items-end mb-1 text-xs">
                      <span className="text-[#524345]">Hydration Retention</span>
                      <span className="font-bold text-[#8c4b5a]">{profile?.hydrationLevel || 32}%</span>
                    </div>
                    <div className="w-full h-2 bg-white rounded-full overflow-hidden border border-[#d7c1c4]/20">
                      <div 
                        className="h-full bg-[#8c4b5a] transition-all duration-1000"
                        style={{ width: `${profile?.hydrationLevel || 32}%` }}
                      ></div>
                    </div>
                    <span className="text-[10px] text-[#847375] italic mt-1 block">Critical dehydration zone (<span className="text-[#ba1a1a]">Tightness trigger &lt; 40%</span>)</span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#847375] tracking-widest block mb-2">Elasticity &amp; Cellular Bounce</span>
                    <span className="font-sans text-xs font-semibold text-[#5A3E2D]">{profile?.elasticityIndex || "Moderately Compromised"}</span>
                  </div>

                  <div className="pt-4 border-t border-[#d7c1c4]/30">
                    <span className="text-[10px] uppercase font-bold text-[#847375] tracking-widest block mb-2">Dermal Match Priorities</span>
                    <div className="flex flex-wrap gap-1.5">
                      {profile?.concerns && profile.concerns.length > 0 ? (
                        profile.concerns.map((con, idx) => (
                          <span key={idx} className="bg-white border border-[#d7c1c4]/30 px-2 py-0.5 rounded-sm text-[10px] uppercase text-[#5A3E2D]">
                            {con}
                          </span>
                        ))
                      ) : (
                        ["Dryness", "Sensitivity", "Dehydration"].map((con, idx) => (
                          <span key={idx} className="bg-white border border-[#d7c1c4]/30 px-2 py-0.5 rounded-sm text-[10px] uppercase text-[#5A3E2D]">
                            {con}
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="bg-[#8c4b5a]/5 p-4 border-l-2 border-[#8c4b5a] rounded-r-md text-xs text-[#524345] italic leading-relaxed">
                    "{profile?.notes || "Extracted lipids show variability on outer hydration channels. Requiring immediate lamellar reinforcement."}"
                  </div>

                  <div className="pt-4 border-t border-[#d7c1c4]/30 space-y-2">
                    <div className="flex justify-between items-center text-xs text-[#524345]">
                      <span>Recommended Dermal pH:</span>
                      <span className="font-bold text-[#8c4b5a]">{profile?.phRecommended || "5.5 - 6.0"}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-[#524345]">
                      <span>Primary active ingredient fit:</span>
                      <span className="font-bold text-[#5A3E2D]">{profile?.keyIngredientNeeded || "Ceramide NP"}</span>
                    </div>
                  </div>
                </div>
              </aside>

              {/* matched biological Product recommendations Cards */}
              <section className="lg:col-span-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {recommendedProducts.map((prod) => (
                    <div 
                      key={prod.id} 
                      className="bg-white border border-[#d7c1c4]/25 rounded-lg overflow-hidden flex flex-col justify-between group hover:shadow-md transition-shadow"
                    >
                      <div className="relative aspect-[4/5] bg-[#efeeea] overflow-hidden">
                        <img 
                          className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-700"
                          alt={prod.name}
                          src={prod.image}
                        />
                        <div className="absolute top-4 left-4 bg-[#fbf9f5]/90 backdrop-blur-xs px-3 py-1 font-sans text-[10px] uppercase tracking-widest text-[#8c4b5a] font-bold border border-[#d7c1c4]/20 shadow-xs">
                          {prod.stepName || "Treatment"}
                        </div>
                      </div>

                      <div className="p-6 space-y-4 flex flex-col flex-grow justify-between">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-[#847375] tracking-widest">{prod.category}</span>
                          <h3 className="font-serif font-semibold text-xl text-[#5A3E2D] mt-1">{prod.name}</h3>
                          <p className="text-xs text-[#524345] line-clamp-2 mt-2 leading-relaxed">{prod.description}</p>
                          <div className="text-[11px] text-[#524345] mt-3">
                            <span className="font-semibold text-[#8c4b5a]">Bio-active:</span> {prod.activeIngredient}
                          </div>
                        </div>

                        <div className="pt-4 border-t border-[#d7c1c4]/15 flex items-center justify-between gap-4">
                          <span className="text-base font-bold text-[#8c4b5a]">${prod.price.toFixed(2)}</span>
                          <button 
                            onClick={() => {
                              addToCart(prod);
                              alert(`${prod.name} has been added to your clinical regimen bundle.`);
                            }}
                            className="bg-[#8c4b5a] hover:bg-[#6f3442] text-white px-5 py-2.5 font-semibold text-[10px] uppercase tracking-widest transition-colors rounded-xs active:scale-95 cursor-pointer"
                          >
                            Add to regimen
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Primary Complete Regimen checkout CTA */}
                <div className="bg-[#f5f3ef] border border-[#d7c1c4]/45 p-6 rounded-lg flex flex-col md:flex-row justify-between items-center gap-6 mt-8">
                  <div>
                    <h3 className="font-serif font-bold text-lg text-[#5A3E2D]">Aura Full Clinical Prescription Set</h3>
                    <p className="text-xs text-[#847375] mt-1">Unlock maximum synergy benefit. Restores optimal pH barrier indices.</p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                    <button 
                      onClick={() => setShowSaveModal(true)}
                      className="text-xs font-semibold tracking-widest uppercase text-[#8c4b5a] hover:text-[#6f3442] flex items-center gap-1 cursor-pointer bg-white border border-[#d7c1c4]/30 px-4 py-3.5 rounded-sm shadow-2xs w-full sm:w-auto justify-center"
                    >
                      <Bookmark className="w-3.5 h-3.5" /> Save Regimen
                    </button>
                    <button 
                      onClick={addAllRecommendationsToCart}
                      className="bg-[#8c4b5a] hover:bg-[#6f3442] text-white px-8 py-3.5 font-semibold text-xs uppercase tracking-widest transition-colors rounded-xs shadow-lg shadow-[#8c4b5a]/10 w-full sm:w-auto text-center cursor-pointer"
                    >
                      Complete My Regimen — ${(recommendedProducts.reduce((sum, p) => sum + p.price, 0)).toFixed(2)}
                    </button>
                  </div>
                </div>

                {/* Return navigation routes block */}
                <div className="flex justify-between items-center pt-8 border-t border-[#d7c1c4]/30 mt-12">
                  <button 
                    onClick={() => setView("chat")}
                    className="flex items-center gap-1.5 text-xs font-semibold text-[#847375] hover:text-[#8c4b5a] uppercase tracking-widest cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" /> Back to Consulting Chat
                  </button>
                  <button 
                    onClick={() => { setView("catalog"); setActiveConcernFilter("All"); }}
                    className="flex items-center gap-1.5 text-xs font-semibold text-[#847375] hover:text-[#8c4b5a] uppercase tracking-widest cursor-pointer border-b border-[#847375] pb-0.5"
                  >
                    Browse Complete Catalog
                  </button>
                </div>
              </section>
            </div>

            {/* Interactive Save Prescription Dialog popup inline */}
            {showSaveModal && (
              <div className="fixed inset-0 bg-[#5A3E2D]/60 backdrop-blur-xs flex items-center justify-center z-50 p-margin-mobile">
                <div className="bg-[#fbf9f5] border border-[#d7c1c4] p-8 max-w-md w-full rounded-lg shadow-2xl relative z-10 space-y-6">
                  <div className="flex justify-between items-center border-b border-[#d7c1c4]/30 pb-3">
                    <h3 className="font-serif font-bold text-xl text-[#5A3E2D]">Save Aura Regimen to Email</h3>
                    <button 
                      onClick={() => setShowSaveModal(false)}
                      className="text-[#847375] hover:text-black font-semibold text-sm h-6 w-6 flex items-center justify-center rounded-full hover:bg-[#efeeea]"
                    >
                      ✕
                    </button>
                  </div>

                  {saveSuccessMessage ? (
                    <div className="p-4 bg-[#cae8ef]/45 border border-[#cae8ef] text-[#021f24] rounded-md text-sm space-y-3">
                      <div className="flex items-center gap-2 font-bold text-emerald-800">
                        <CheckCircle className="w-5 h-5 text-emerald-700" /> Regimen Saved Successfully
                      </div>
                      <p className="text-xs">{saveSuccessMessage}</p>
                    </div>
                  ) : (
                    <form onSubmit={handleSaveToAccount} className="space-y-4">
                      <p className="text-xs text-[#524345] leading-relaxed">
                        Access your formulated bio-ingredients diagnostics at any time. Enter your email to register this session's Molecular analysis profile locally.
                      </p>
                      
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold text-[#847375] tracking-widest block">Your Email Address</label>
                        <div className="flex border border-[#d7c1c4] bg-[#F9EFE7] focus-within:ring-2 focus-within:ring-[#8c4b5a]/25 rounded-md px-3 py-2 items-center">
                          <Mail className="w-4 h-4 text-[#847375] mr-2 shrink-0" />
                          <input 
                            type="email" 
                            required
                            placeholder="you@domain.com"
                            value={saveEmail}
                            onChange={(e) => setSaveEmail(e.target.value)}
                            className="bg-transparent border-none text-sm w-full text-[#5A3E2D] focus:outline-none"
                          />
                        </div>
                      </div>

                      <button 
                        type="submit"
                        className="w-full bg-[#8c4b5a] hover:bg-[#6f3442] text-white py-3 uppercase tracking-wider font-semibold text-xs rounded-sm shadow-md cursor-pointer"
                      >
                        Commit Registration
                      </button>
                    </form>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW 5: CART & SECURE CHECKOUT PAGE */}
        {view === "checkout" && (
          <div className="max-w-[1440px] mx-auto px-margin-mobile md:px-margin-desktop py-12 md:py-20 fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              
              {/* Left Side: Cart Regimen List */}
              <section className="lg:col-span-7 space-y-8">
                <div>
                  <h1 className="font-serif font-bold text-3xl md:text-4xl text-[#5A3E2D] mb-2">The Aura Prescription Bag</h1>
                  <p className="text-sm text-[#847375]">Review your customized diagnostic selection before dispatch.</p>
                </div>

                {cart.length === 0 ? (
                  <div className="bg-white border border-[#d7c1c4]/20 rounded-lg p-10 text-center space-y-4">
                    <ShoppingBag className="w-12 h-12 text-[#d7c1c4] mx-auto" />
                    <h3 className="font-serif font-semibold text-xl text-[#5A3E2D]">Your selection bag is currently empty</h3>
                    <p className="text-xs text-[#847375] max-w-sm mx-auto">
                      Initiate our AI skin diagnostic or browse our complete collection of clinically proven cellular formulations.
                    </p>
                    <div className="flex justify-center gap-3">
                      <button 
                        onClick={() => setView("portal")} 
                        className="bg-[#8c4b5a] text-white px-6 py-3 uppercase text-xs tracking-widest font-semibold rounded-sm hover:bg-[#6f3442] transition-colors cursor-pointer"
                      >
                        Start AI Diagnosis
                      </button>
                      <button 
                        onClick={() => { setView("catalog"); setActiveConcernFilter("All"); }}
                        className="border border-[#8c4b5a] text-[#8c4b5a] px-6 py-3 uppercase text-xs tracking-widest font-semibold rounded-sm hover:bg-[#ffd9df]/20 transition-all cursor-pointer"
                      >
                        Browse Catalog
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {cart.map((item) => (
                      <div 
                        key={item.product.id} 
                        className="flex flex-col sm:flex-row gap-6 p-4 bg-white border border-[#d7c1c4]/20 rounded-lg group"
                      >
                        <div className="w-full sm:w-24 h-28 bg-[#f5f3ef] rounded-md overflow-hidden shrink-0 border border-[#d7c1c4]/15">
                          <img 
                            className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                            alt={item.product.name}
                            src={item.product.image}
                          />
                        </div>

                        <div className="flex-grow flex flex-col justify-between">
                          <div className="flex justify-between items-start gap-4">
                            <div>
                              <h3 className="font-serif font-semibold text-lg text-[#5A3E2D]">{item.product.name}</h3>
                              <p className="text-xs text-[#847375] mt-0.5">{item.product.category}</p>
                              {item.product.skinConcern && (
                                <span className="inline-block mt-2 px-2.5 py-0.5 bg-[#fbf9f5] border border-[#d7c1c4]/30 rounded-sm text-[9px] uppercase tracking-wider text-[#8c4b5a] font-bold">
                                  Concern: {item.product.skinConcern}
                                </span>
                              )}
                            </div>
                            <span className="font-bold text-base text-[#8c4b5a]">${(item.product.price * item.quantity).toFixed(2)}</span>
                          </div>

                          <div className="flex justify-between items-center mt-4 pt-3 border-t border-[#d7c1c4]/10">
                            {/* Quantity selector */}
                            <div className="flex items-center border border-[#d7c1c4]/45 rounded-md bg-[#fbf9f5]">
                              <button 
                                type="button"
                                onClick={() => updateQuantity(item.product.id, -1)}
                                className="p-2 hover:bg-[#efeeea] text-[#5A3E2D] transition-colors"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="px-3 text-xs font-semibold">{item.quantity}</span>
                              <button 
                                type="button"
                                onClick={() => updateQuantity(item.product.id, 1)}
                                className="p-2 hover:bg-[#efeeea] text-[#5A3E2D] transition-colors"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <button 
                              type="button"
                              onClick={() => removeFromCart(item.product.id)}
                              className="text-xs font-semibold text-[#847375] hover:text-[#ba1a1a] flex items-center gap-1 uppercase tracking-widest transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-[#ba1a1a]" /> Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}

                    <div className="p-4 bg-[#ffd9df]/10 border border-[#ffd9df]/30 rounded-lg flex items-center gap-3">
                      <Sparkles className="w-5 h-5 text-[#8c4b5a]" />
                      <p className="text-xs text-[#524345]">
                        Your curated prescription contains highly synergetic components. Sequence booklet instructions are enclosed.
                      </p>
                    </div>
                  </div>
                )}
              </section>

              {/* Right Side: Secure checkout Form */}
              <aside className="lg:col-span-5">
                <div className="bg-white border border-[#d7c1c4]/30 p-6 md:p-8 rounded-lg shadow-xs space-y-6 sticky top-28">
                  <div className="border-b border-[#d7c1c4]/20 pb-4 flex justify-between items-center">
                    <h2 className="font-serif font-bold text-2xl text-[#5A3E2D]">Checkout details</h2>
                    <Lock className="w-4 h-4 text-[#8c4b5a] opacity-80" />
                  </div>

                  <form onSubmit={handleCheckoutSubmit} className="space-y-6">
                    {/* Shipping Address fields */}
                    <div className="space-y-4">
                      <label className="text-[10px] uppercase font-bold text-[#847375] tracking-widest block">Shipping details</label>
                      <input 
                        type="text" 
                        required
                        placeholder="Recipient's Full Name"
                        value={checkoutForm.fullName}
                        onChange={(e) => setCheckoutForm(prev => ({ ...prev, fullName: e.target.value }))}
                        className="w-full bg-[#fbf9f5] border border-[#d7c1c4]/45 focus:border-[#8c4b5a] focus:ring-1 focus:ring-[#8c4b5a]/25 rounded-md px-4 py-3 text-sm text-[#5A3E2D]"
                      />
                      <input 
                        type="text" 
                        required
                        placeholder="Street Address &amp; Suite"
                        value={checkoutForm.streetAddress}
                        onChange={(e) => setCheckoutForm(prev => ({ ...prev, streetAddress: e.target.value }))}
                        className="w-full bg-[#fbf9f5] border border-[#d7c1c4]/45 focus:border-[#8c4b5a] focus:ring-1 focus:ring-[#8c4b5a]/25 rounded-md px-4 py-3 text-sm text-[#5A3E2D]"
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <input 
                          type="text" 
                          required
                          placeholder="City"
                          value={checkoutForm.city}
                          onChange={(e) => setCheckoutForm(prev => ({ ...prev, city: e.target.value }))}
                          className="w-full bg-[#fbf9f5] border border-[#d7c1c4]/45 focus:border-[#8c4b5a] focus:ring-1 focus:ring-[#8c4b5a]/25 rounded-md px-4 py-3 text-sm text-[#5A3E2D]"
                        />
                        <input 
                          type="text" 
                          required
                          placeholder="Zip Code"
                          value={checkoutForm.zipCode}
                          onChange={(e) => setCheckoutForm(prev => ({ ...prev, zipCode: e.target.value }))}
                          className="w-full bg-[#fbf9f5] border border-[#d7c1c4]/45 focus:border-[#8c4b5a] focus:ring-1 focus:ring-[#8c4b5a]/25 rounded-md px-4 py-3 text-sm text-[#5A3E2D]"
                        />
                      </div>
                    </div>

                    {/* Payment detail elements */}
                    <div className="space-y-4 pt-4 border-t border-[#d7c1c4]/15">
                      <div className="flex justify-between items-center text-xs">
                        <label className="text-[10px] uppercase font-bold text-[#847375] tracking-widestBlock">Payment gateway</label>
                        <span className="text-[10px] text-emerald-800 font-bold flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-emerald-600" /> Secure encrypted
                        </span>
                      </div>
                      <input 
                        type="text" 
                        required
                        placeholder="Card Number"
                        value={checkoutForm.cardNumber}
                        onChange={(e) => setCheckoutForm(prev => ({ ...prev, cardNumber: e.target.value }))}
                        className="w-full bg-[#fbf9f5] border border-[#d7c1c4]/45 focus:border-[#8c4b5a] focus:ring-1 focus:ring-[#8c4b5a]/25 rounded-md px-4 py-3 text-sm text-[#5A3E2D]"
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <input 
                          type="text" 
                          required
                          placeholder="MM/YY"
                          value={checkoutForm.expiryDate}
                          onChange={(e) => setCheckoutForm(prev => ({ ...prev, expiryDate: e.target.value }))}
                          className="w-full bg-[#fbf9f5] border border-[#d7c1c4]/45 focus:border-[#8c4b5a] focus:ring-1 focus:ring-[#8c4b5a]/25 rounded-md px-4 py-3 text-sm text-[#5A3E2D]"
                        />
                        <input 
                          type="text" 
                          required
                          placeholder="CVC"
                          value={checkoutForm.cvc}
                          onChange={(e) => setCheckoutForm(prev => ({ ...prev, cvc: e.target.value }))}
                          className="w-full bg-[#fbf9f5] border border-[#d7c1c4]/45 focus:border-[#8c4b5a] focus:ring-1 focus:ring-[#8c4b5a]/25 rounded-md px-4 py-3 text-sm text-[#5A3E2D]"
                        />
                      </div>
                    </div>

                    {/* Order summary calculations box */}
                    <div className="pt-6 border-t border-[#d7c1c4]/20 space-y-3">
                      <div className="flex justify-between text-sm text-[#524345]">
                        <span>Dermal Products Subtotal</span>
                        <span>${subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-[#524345]">
                        <span>Express Lab Dispatch</span>
                        <span className="text-[#8c4b5a] font-bold text-xs uppercase tracking-widest">Complimentary</span>
                      </div>
                      <div className="flex justify-between text-sm text-[#524345]">
                        <span>Local Clinical Sales Tax</span>
                        <span>${tax.toFixed(2)}</span>
                      </div>

                      <div className="flex justify-between items-center text-lg font-bold text-[#5A3E2D] pt-3 border-t border-[#d7c1c4]/15">
                        <span>Grand Tally Amount</span>
                        <span className="text-xl text-[#8c4b5a]">${grandTotal.toFixed(2)}</span>
                      </div>
                    </div>

                    <button 
                      type="submit"
                      disabled={cart.length === 0 || isSubmittingCheckout}
                      className="w-full bg-[#8c4b5a] hover:bg-[#6f3442] disabled:opacity-40 text-white font-bold py-4 rounded-md uppercase tracking-[0.2em] text-xs transition-colors shadow-lg shadow-[#8c4b5a]/10 cursor-pointer"
                    >
                      {isSubmittingCheckout ? "Processing transaction..." : "AUTHORIZE DISPATCH"}
                    </button>
                    <p className="text-center text-[10px] text-[#847375] uppercase tracking-widest">
                      Secured by clinical-grade 256-bit encryption channels
                    </p>
                  </form>
                </div>
              </aside>
            </div>
          </div>
        )}

        {/* VIEW 6: PURCHASE COMPLETED CELEBRATION */}
        {view === "purchase_completed" && (
          <div className="max-w-2xl mx-auto py-24 px-margin-mobile text-center space-y-8 fade-in">
            <div className="w-16 h-16 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center mx-auto text-emerald-800">
              <CheckCircle className="w-10 h-10 text-emerald-700" />
            </div>

            <div className="space-y-3">
              <span className="text-[#8c4b5a] font-bold text-xs uppercase tracking-[0.2em] block">Transaction Secured &amp; Completed</span>
              <h1 className="font-serif font-bold text-4xl text-[#5A3E2D]">Your Regimen is Prescribed</h1>
              <p className="text-sm text-[#524345] max-w-lg mx-auto leading-relaxed">
                Thank you. Your formulated molecular compounds have been forwarded to our synthesis laboratory. Customized botanical extraction and sequence bottling is underway.
              </p>
            </div>

            <div className="bg-[#f5f3ef]/60 p-6 border border-[#d7c1c4]/25 rounded-md space-y-4 max-w-md mx-auto text-left">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#8c4b5a]" />
                <span className="text-xs font-semibold text-[#5A3E2D] uppercase tracking-wider">Estimated Delivery Tally:</span>
              </div>
              <p className="text-xs text-[#524345] leading-relaxed">
                An confirmation tracking email has been sent. Your custom compounds packet will arrive via Cold-Chain Express Shipping within <strong>2 to 3 Business Days</strong>.
              </p>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center max-w-sm mx-auto">
              <button 
                onClick={() => setView("home")}
                className="bg-[#8c4b5a] hover:bg-[#6f3442] text-white px-6 py-3.5 font-semibold text-xs uppercase tracking-widest rounded-xs shadow-md w-full"
              >
                Return to homepage
              </button>
              <button 
                onClick={() => { setView("catalog"); setActiveConcernFilter("All"); }}
                className="border border-[#847375] text-[#5A3E2D] hover:bg-[#efeeea] px-6 py-3.5 font-semibold text-xs uppercase tracking-widest rounded-xs w-full"
              >
                Keep Browsing Collection
              </button>
            </div>
          </div>
        )}

        {/* VIEW 7: COMPLETE PRODUCTS CATALOG */}
        {view === "catalog" && (
          <div className="fade-in">
            {/* Catalog Hero overview */}
            <section className="bg-[#efeeea]/60 py-12 md:py-20 border-b border-[#d7c1c4]/20">
              <div className="px-margin-mobile md:px-margin-desktop w-full max-w-[1440px] mx-auto flex flex-col md:flex-row items-center gap-12">
                <div className="flex-1 space-y-4">
                  <h1 className="font-serif font-bold text-3xl md:text-5xl text-[#5A3E2D] leading-tight">
                    Clinical Luxury, <br />
                    <span className="italic font-normal text-[#8c4b5a]">Defined by Science.</span>
                  </h1>
                  <p className="text-[#524345] text-sm md:text-base leading-relaxed max-w-lg">
                    Explore our curated selection of high-performance formulations designed to harmonize with your unique skin biology indices.
                  </p>
                </div>
                <div className="hidden md:block flex-1 max-w-[450px]">
                  <div className="aspect-[4/3] bg-white overflow-hidden rounded-lg border border-[#d7c1c4]/20 shadow-lg">
                    <img 
                      alt="Travertine block skincare"
                      className="w-full h-full object-cover" 
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuDCiCBeu-a-r5N94cbL0LPmFh28ePuICY84JuQb_4GSoDggEP5qSXLeXCFBvM8LenaFtIZA5j5sc5cIXqkUToq4hBUC8GUFKdp5ZI8vskznTT7W3iP5imrSBKukQcwpDai9062MifRlh4JSVzk6vgqW_RZFKhO7lN4B1GmgMxCROEmUZ55u-R-DF3AmHwOUR1XrFkkRxqmnoq3cQhJokKjtSmOLcLFcT8GyoBDVjx-ZBLIKNANBUPJW0FGOg4mnusiP69_NYXUYYVs"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Catalog filter selection block */}
            <section className="sticky top-20 z-40 bg-[#fbf9f5]/90 backdrop-blur-md border-b border-[#d7c1c4]/20 shadow-xs">
              <div className="px-margin-mobile md:px-margin-desktop w-full max-w-[1440px] mx-auto py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4 overflow-x-auto select-none no-scrollbar py-2">
                  {["All", "Dryness", "Sensitivity", "Dehydration", "Fine Lines", "Protection"].map((concern) => (
                    <button 
                      key={concern}
                      onClick={() => setActiveConcernFilter(concern)}
                      className={`px-4 py-2 font-semibold text-xs uppercase tracking-widest rounded-full border transition-all cursor-pointer text-nowrap ${activeConcernFilter === concern ? "bg-[#8c4b5a] text-white border-[#8c4b5a]" : "bg-white text-[#524345] border-[#d7c1c4]/30 hover:border-[#8c4b5a]"}`}
                    >
                      {concern === "All" ? "All Items" : concern}
                    </button>
                  ))}
                </div>

                <div className="flex justify-between md:justify-end items-center gap-6 text-xs text-[#847375] pt-2 md:pt-0 border-t md:border-t-0 border-[#d7c1c4]/15">
                  <span className="font-semibold text-[10px] uppercase tracking-widest text-[#524345]">Showing {filteredProducts.length} high-potency formulations</span>
                </div>
              </div>
            </section>

            {/* Products grid collection */}
            <section className="py-16 px-margin-mobile md:px-margin-desktop w-full max-w-[1440px] mx-auto">
              {filteredProducts.length === 0 ? (
                <div className="bg-white border p-12 text-center rounded-lg max-w-md mx-auto space-y-4">
                  <p className="text-sm text-[#847375]">No formulations match your search or filter requirements.</p>
                  <button 
                    onClick={() => { setSearchQuery(""); setActiveConcernFilter("All"); }}
                    className="bg-[#8c4b5a] text-white px-5 py-2.5 text-xs font-semibold uppercase tracking-widest rounded-xs"
                  >
                    Clear Filter
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredProducts.map((prod) => (
                    <div 
                      key={prod.id} 
                      className="bg-white border border-[#d7c1c4]/20 rounded-lg overflow-hidden flex flex-col justify-between group hover:shadow-lg transition-all"
                    >
                      <div className="relative aspect-[3/4] bg-[#f5f3ef] overflow-hidden">
                        <img 
                          className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-700" 
                          alt={prod.name}
                          src={prod.image}
                        />
                        {prod.stepName && (
                          <span className="absolute top-4 left-4 bg-[#fbf9f5]/90 border border-[#d7c1c4]/15 backdrop-blur-xs px-2 py-0.5 rounded-sm text-[9px] uppercase tracking-widest text-[#8c4b5a] font-bold">
                            {prod.stepName}
                          </span>
                        )}
                        <span className="absolute bottom-4 right-4 bg-[#cae8ef] text-[#021f24] font-bold text-[9px] uppercase px-2 py-0.5 rounded-sm">
                          {prod.skinConcern}
                        </span>
                      </div>

                      <div className="p-6 space-y-3 flex flex-col justify-between flex-grow">
                        <div>
                          <span className="text-[9px] uppercase font-bold text-[#847375] tracking-widest block">{prod.category}</span>
                          <h3 className="font-serif font-semibold text-lg text-[#5A3E2D] mt-1 group-hover:text-[#8c4b5a] transition-colors">{prod.name}</h3>
                          <p className="text-xs text-[#847375] line-clamp-2 mt-2 leading-relaxed">{prod.description}</p>
                          <p className="text-[10px] text-[#524345] italic mt-2"><strong className="text-[#8c4b5a]">Active:</strong> {prod.activeIngredient}</p>
                        </div>

                        <div className="pt-4 border-t border-[#d7c1c4]/15 flex items-center justify-between gap-4 mt-2">
                          <span className="text-base font-bold text-[#8c4b5a]">${prod.price.toFixed(2)}</span>
                          <button 
                            onClick={() => {
                              addToCart(prod);
                              alert(`${prod.name} added to checkout.`);
                            }}
                            className="bg-[#8c4b5a] hover:bg-[#6f3442] text-white px-4 py-2 font-semibold text-[10px] uppercase tracking-widest rounded-xs transition-colors cursor-pointer active:scale-95"
                          >
                            Quick Add
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

      </main>

      {/* Structured Marquee scientific proofs ticker */}
      <div className="w-full overflow-hidden bg-[#efeeea] py-6 border-y border-[#d7c1c4]/20">
        <div className="flex whitespace-nowrap gap-16 items-center animate-marquee cursor-default">
          <span className="text-xs uppercase font-bold tracking-[0.25em] text-[#847375]">Clinical Grade Formulations</span>
          <span className="w-2 h-2 rounded-full bg-[#8c4b5a]"></span>
          <span className="text-xs uppercase font-bold tracking-[0.25em] text-[#847375]">Dermatologist Approved</span>
          <span className="w-2 h-2 rounded-full bg-[#8c4b5a]"></span>
          <span className="text-xs uppercase font-bold tracking-[0.25em] text-[#847375]">AI-Driven Dermal match</span>
          <span className="w-2 h-2 rounded-full bg-[#8c4b5a]"></span>
          <span className="text-xs uppercase font-bold tracking-[0.25em] text-[#847375]">100% Sustainable sourcing</span>
          <span className="w-2 h-2 rounded-full bg-[#8c4b5a]"></span>
          {/* Repeated for loop continuity */}
          <span className="text-xs uppercase font-bold tracking-[0.25em] text-[#847375]">Clinical Grade Formulations</span>
          <span className="w-2 h-2 rounded-full bg-[#8c4b5a]"></span>
          <span className="text-xs uppercase font-bold tracking-[0.25em] text-[#847375]">Dermatologist Approved</span>
          <span className="w-2 h-2 rounded-full bg-[#8c4b5a]"></span>
          <span className="text-xs uppercase font-bold tracking-[0.25em] text-[#847375]">AI-Driven Dermal match</span>
          <span className="w-2 h-2 rounded-full bg-[#8c4b5a]"></span>
          <span className="text-xs uppercase font-bold tracking-[0.25em] text-[#847375]">100% Sustainable sourcing</span>
        </div>
      </div>

      {/* Foot banner client list signup */}
      <section className="py-20 border-t border-[#d7c1c4]/30 text-center bg-white">
        <div className="max-w-xl mx-auto px-margin-mobile space-y-6">
          <h2 className="font-serif font-bold text-2xl md:text-3xl text-[#5A3E2D]">The Aura Ledger</h2>
          <p className="text-xs text-[#847375] leading-relaxed">
            Registered members receive exclusive research regarding clinical skin modeling, luxury developments, and priority laboratory dispatch events.
          </p>
          <form 
            onSubmit={(e) => { e.preventDefault(); alert("Ledger subscription accepted! Welcome to the Aura medical elite."); }} 
            className="flex flex-col sm:flex-row gap-3 pt-2"
          >
            <input 
              type="email" 
              required
              placeholder="ENTER EMAIL ADDRESS"
              className="flex-grow bg-[#fbf9f5] border border-[#d7c1c4] focus:border-[#8c4b5a] text-xs uppercase tracking-widest px-5 py-4 rounded-md text-[#5A3E2D]"
            />
            <button 
              type="submit"
              className="bg-[#5A3E2D] hover:bg-[#8c4b5a] text-white px-8 py-4 font-bold text-xs uppercase tracking-widest transition-colors rounded-sm cursor-pointer"
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>

      {/* Shared Luxury Footer Component */}
      <footer className="bg-[#f5f3ef] border-t border-[#d7c1c4]/20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 px-margin-mobile md:px-margin-desktop py-16 w-full max-w-[1440px] mx-auto">
          <div className="space-y-4">
            <div className="font-serif font-bold text-lg text-[#5A3E2D]">Aura Science</div>
            <p className="text-xs text-[#847375] leading-relaxed max-w-xs">
              Defining the future of clinical luxury skincare through molecular biological precision and ethical sourcing.
            </p>
          </div>
          
          <div className="space-y-3">
            <span className="text-[#8c4b5a] font-bold text-xs uppercase tracking-widest block mb-2">Discovery</span>
            <nav className="flex flex-col gap-2.5 text-xs text-[#524345]">
              <button onClick={() => setView("home")} className="hover:text-[#8c4b5a] hover:underline hover:underline-offset-4 cursor-pointer text-left">About Clinical Team</button>
              <button onClick={() => { setView("catalog"); setActiveConcernFilter("All"); }} className="hover:text-[#8c4b5a] hover:underline hover:underline-offset-4 cursor-pointer text-left">Bioactive Ingredients</button>
              <button onClick={() => setView("portal")} className="hover:text-[#8c4b5a] hover:underline hover:underline-offset-4 cursor-pointer text-left">Corporate Wellness</button>
            </nav>
          </div>

          <div className="space-y-3">
            <span className="text-[#8c4b5a] font-bold text-xs uppercase tracking-widest block mb-2">Assistance</span>
            <nav className="flex flex-col gap-2.5 text-xs text-[#524345]">
              <button onClick={() => setView("portal")} className="hover:text-[#8c4b5a] hover:underline hover:underline-offset-4 cursor-pointer text-left">Frequently Asked Questions</button>
              <button onClick={() => setView("checkout")} className="hover:text-[#8c4b5a] hover:underline hover:underline-offset-4 cursor-pointer text-left">Shipping &amp; Lab Return Details</button>
              <button onClick={() => alert("Concierge details: Call 1-800-AURA-BOT or email concierge@aurascience.clinical")} className="hover:text-[#8c4b5a] hover:underline hover:underline-offset-4 cursor-pointer text-left">Virtual Concierge Help</button>
            </nav>
          </div>

          <div className="space-y-3">
            <span className="text-[#8c4b5a] font-bold text-xs uppercase tracking-widest block mb-2">Legal Policy</span>
            <nav className="flex flex-col gap-2.5 text-xs text-[#524345]">
              <span className="cursor-default">Privacy &amp; Security Compliance</span>
              <span className="cursor-default">Terms of Clinical Support Services</span>
              <div className="flex gap-4 mt-2">
                <button className="material-symbols-outlined text-[#847375] hover:text-[#8c4b5a] text-lg">share</button>
                <button className="material-symbols-outlined text-[#847375] hover:text-[#8c4b5a] text-lg">verified_user</button>
              </div>
            </nav>
          </div>
        </div>

        <div className="border-t border-[#d7c1c4]/15 px-margin-mobile md:px-margin-desktop py-8 w-full max-w-[1440px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-[#847375]">
          <p>© 2026 Aura Science. Clinical Luxury Skincare. All Rights Reserved.</p>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse"></div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#847375]">Lab Status: Operational &amp; Optimal</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
