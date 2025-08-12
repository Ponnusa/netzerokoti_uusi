// Part 1: Imports, State, and Constants
import React, { useState, useEffect, useRef } from "react";
import {
  Camera,
  Upload,
  Leaf,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Car,
  TreePine,
  Target,
  Calendar,
  Settings,
  BarChart,
  Home,
  ArrowRight,
  Smartphone,
  Brain,
  Globe,
  FileText,
  Users,
  Clock,
  Zap,
  Droplets,
  Info,
  Download,
  BarChart3,
  Plus,
  Trash2,
  ShoppingCart,
  Calculator,
  GraduationCap,
  Thermometer,
  Building2,
  TrendingDown
} from "lucide-react";

const App = () => {
  const [formData, setFormData] = useState({
    houseType: "apartment",
    builtArea: 80,
    constructionYear: 2000,
    residents: 2,
    heatingSystem: "district",
    districtLocation: "helsinki",
    hotWaterReading: "",
    coldWaterReading: "",
    waterPeriod: "monthly",
    electricityProvider: "helen",
    productType: "standard",
    electricityConsumption: 3000,
    consumptionPeriod: "yearly",
    displayMode: "yearly",
    calculationMethod: "market-based",
    vehicles: [],
    groceryMethod: "loyalty",
    groceryCO2: "",
    groceryPeriod: "annual",
    grocerySpend: "",
    grocerySpendPeriod: "monthly",
    dietType: "balanced",
    emissionFactor: 0.85,
    
    // New fields for receipt analysis
    receiptAnalysisApiUrl: "https://ecoreceiptbackend-production.up.railway.app",
    uploadedReceipts: [],
    receiptTotalEmissions: 0,
    receiptAnalysisPeriod: "monthly",
  });

  const [currentPage, setCurrentPage] = useState("home");
  const [results, setResults] = useState({
    totalEmissions: 0,
    heatingEmissions: 0,
    electricityEmissions: 0,
    wastewaterEmissions: 0,
    transportEmissions: 0,
    groceryEmissions: 0,
    netZeroScore: 60,
    emissionRating: "C",
    perPersonEmissions: 0,
    perM2Emissions: 0,
  });

  const [showComparison, setShowComparison] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Constants and helper functions
  const getEnergyDemand = (year) => {
    if (year < 1960) return 240;
    if (year < 1980) return 210;
    if (year < 2000) return 180;
    if (year < 2010) return 140;
    if (year < 2019) return 100;
    return 70;
  };

  const districtHeatingFactors = {
    espoo: 87.64,
    helsinki: 126.41,
    vantaa: 153.71,
    tampere: 82.8,
    other: 157.0,
  };

  const heatingEmissionFactors = {
    electric: 0.12,
    oil: 0.26,
    geothermal: 0.034,
    district: (location) => districtHeatingFactors[location] / 1000,
  };

  const getDietEmissionFactor = (dietType) => {
    const dietFactors = {
      "meat-heavy": 1.4,
      balanced: 0.85,
      vegetarian: 0.6,
      vegan: 0.4,
      national: 0.7,
    };
    return dietFactors[dietType] || 0.85;
  };

  const getTransportEmissionFactor = (type, fuelType) => {
    const factors = {
      car: {
        petrol: 150,
        diesel: 140,
        hybrid: 90,
        phev: 60,
        bev: 0,
      },
      motorcycle: {
        under125cc: 65,
        "125to250cc": 95,
        "250to500cc": 115,
        "500to1000cc": 145,
        over1000cc: 185,
        electric: 0,
      },
      bike: {
        manual: 0,
        electric: 0,
      },
    };

    return factors[type]?.[fuelType] || 0;
  };

  const electricityEmissionFactors = {
    fortum: { standard: 13.94, renewable: 0, nuclear: 12.5, nuclearMix: 25 },
    helen: { standard: 271, renewable: 0, nuclear: 12.5, nuclearMix: 40 },
    vantaan: { standard: 120, renewable: 0, nuclear: 12.5, nuclearMix: 30 },
    tampere: { standard: 205, renewable: 0, nuclear: 12.5, nuclearMix: 35 },
    other: { standard: 234, renewable: 0, nuclear: 80, nuclearMix: 120 },
  };

  // Part 2: Event Handlers and Receipt Analysis Components
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Receipt Upload Modal Component
  const ReceiptUploadModal = ({ isOpen, onClose, onReceiptAnalyzed, apiUrl }) => {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);

    const handleFileUpload = async (file) => {
      if (!apiUrl) {
        setError('Please configure your Railway API URL first');
        return;
      }

      setUploading(true);
      setError(null);

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('fileType', file.type.includes('pdf') ? 'pdf' : 'image');

        const response = await fetch(`${apiUrl}/api/process-receipt-ai`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`API Error: ${response.status}`);
        }

        const result = await response.json();
        onReceiptAnalyzed(result);
        onClose();
      } catch (err) {
        setError(`Failed to analyze receipt: ${err.message}`);
      } finally {
        setUploading(false);
      }
    };

    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Upload Receipt</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              ×
            </button>
          </div>
          
          <div 
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="text-gray-600">
              {uploading ? (
                <div>
                  <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                  <p>Analyzing receipt with AI...</p>
                </div>
              ) : (
                <div>
                  <p className="mb-2">Click to upload receipt</p>
                  <p className="text-sm text-gray-500">Supports images and PDFs</p>
                </div>
              )}
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) => {
              if (e.target.files[0]) {
                handleFileUpload(e.target.files[0]);
              }
            }}
            className="hidden"
          />

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Receipt analysis handlers
  const handleReceiptAnalyzed = (receiptData) => {
    const newReceipt = {
      id: Date.now(),
      date: new Date().toLocaleDateString(),
      totalEmissions: receiptData.total_emissions || 0,
      totalPrice: receiptData.total_price || 0,
      itemCount: receiptData.items?.length || 0,
      storeName: receiptData.store_info?.name || 'Unknown Store',
      categories: receiptData.categories || {}
    };

    setFormData(prev => ({
      ...prev,
      uploadedReceipts: [...prev.uploadedReceipts, newReceipt]
    }));

    const totalReceiptEmissions = [...formData.uploadedReceipts, newReceipt]
      .reduce((sum, receipt) => sum + receipt.totalEmissions, 0);

    setFormData(prev => ({
      ...prev,
      receiptTotalEmissions: totalReceiptEmissions
    }));
  };

  const removeReceipt = (receiptId) => {
    const updatedReceipts = formData.uploadedReceipts.filter(r => r.id !== receiptId);
    setFormData(prev => ({
      ...prev,
      uploadedReceipts: updatedReceipts,
      receiptTotalEmissions: updatedReceipts.reduce((sum, receipt) => sum + receipt.totalEmissions, 0)
    }));
  };

  const importReceiptData = () => {
    if (formData.uploadedReceipts.length === 0) {
      alert('No receipt data to import. Please upload some receipts first.');
      return;
    }

    const totalEmissions = formData.receiptTotalEmissions;
    const periodMultiplier = formData.receiptAnalysisPeriod === 'monthly' ? 1 : 12;
    const adjustedEmissions = totalEmissions / periodMultiplier;

    setFormData(prev => ({
      ...prev,
      groceryMethod: 'receipt-analysis',
      groceryCO2: adjustedEmissions.toString(),
      groceryPeriod: formData.receiptAnalysisPeriod
    }));

    alert(`Imported ${adjustedEmissions.toFixed(1)} kg CO₂ from ${formData.uploadedReceipts.length} receipt(s)`);
  };

  useEffect(() => {
    calculateEmissions();
  }, [formData]);

  const calculateEmissions = () => {
    const energyDemand = getEnergyDemand(formData.constructionYear);
    const heatingEnergy = formData.builtArea * energyDemand;

    let hotWaterEnergy;
    if (formData.hotWaterReading || formData.coldWaterReading) {
      const hotWater = parseFloat(formData.hotWaterReading) || 0;
      const periodMultiplier =
        formData.waterPeriod === "monthly"
          ? 12
          : formData.waterPeriod === "quarterly"
          ? 4
          : formData.waterPeriod === "semi-annual"
          ? 2
          : 1;
      hotWaterEnergy = hotWater * periodMultiplier * 58;
    } else {
      hotWaterEnergy = formData.residents * 1570;
    }

    const totalHeatingEnergy = heatingEnergy + hotWaterEnergy;
    let heatingFactor;
    if (formData.heatingSystem === "district") {
      heatingFactor = heatingEmissionFactors.district(formData.districtLocation);
    } else {
      heatingFactor = heatingEmissionFactors[formData.heatingSystem];
    }
    const heatingEmissions = totalHeatingEnergy * heatingFactor;

    const electricityFactor =
      electricityEmissionFactors[formData.electricityProvider]?.[formData.productType] || 234;
    const yearlyElectricityConsumption =
      formData.consumptionPeriod === "monthly"
        ? formData.electricityConsumption * 12
        : formData.electricityConsumption;
    const electricityEmissions = yearlyElectricityConsumption * (electricityFactor / 1000);

    let totalWaterConsumption;
    if (formData.hotWaterReading || formData.coldWaterReading) {
      const hotWater = parseFloat(formData.hotWaterReading) || 0;
      const coldWater = parseFloat(formData.coldWaterReading) || 0;
      const periodMultiplier =
        formData.waterPeriod === "monthly"
          ? 12
          : formData.waterPeriod === "quarterly"
          ? 4
          : formData.waterPeriod === "semi-annual"
          ? 2
          : 1;
      totalWaterConsumption = (hotWater + coldWater) * periodMultiplier;
    } else {
      totalWaterConsumption = formData.residents * 54.75;
    }
    const wastewaterEmissions = totalWaterConsumption * 1.2;

    const transportEmissions = formData.vehicles.reduce((total, vehicle) => {
      const yearlyKm = vehicle.period === "monthly" ? vehicle.kilometers * 12 : vehicle.kilometers;
      let emissionFactor = 0;

      if (vehicle.customEmissions && vehicle.customEmissions !== "") {
        emissionFactor = parseFloat(vehicle.customEmissions);
      } else {
        emissionFactor = getTransportEmissionFactor(vehicle.type, vehicle.fuelType);
      }

      return total + (yearlyKm * emissionFactor) / 1000;
    }, 0);

    let groceryEmissions = 0;
    if ((formData.groceryMethod === "loyalty" || formData.groceryMethod === "receipt-analysis") && formData.groceryCO2) {
      const co2Value = parseFloat(formData.groceryCO2);
      groceryEmissions = formData.groceryPeriod === "monthly" ? co2Value * 12 : co2Value;
    } else if (formData.groceryMethod === "spending" && formData.grocerySpend) {
      const spending = parseFloat(formData.grocerySpend);
      const factor =
        formData.emissionFactor && formData.emissionFactor !== ""
          ? parseFloat(formData.emissionFactor)
          : getDietEmissionFactor(formData.dietType);
      const yearlySpending = formData.grocerySpendPeriod === "monthly" ? spending * 12 : spending;
      groceryEmissions = yearlySpending * factor;
    }

    const totalEmissions = heatingEmissions + electricityEmissions + wastewaterEmissions + transportEmissions + groceryEmissions;
    const perPersonEmissions = totalEmissions / formData.residents;
    const perM2Emissions = totalEmissions / formData.builtArea;

    const getEmissionRating = (kgCO2perM2) => {
      if (kgCO2perM2 < 5) return "A";
      if (kgCO2perM2 < 10) return "B";
      if (kgCO2perM2 < 20) return "C";
      if (kgCO2perM2 < 35) return "D";
      if (kgCO2perM2 < 50) return "E";
      if (kgCO2perM2 < 70) return "F";
      return "G";
    };

    const finnishAverage = 4200;
    const calculateNetZeroScore = (emissions) => {
      if (emissions <= 0) return 100;
      if (emissions >= finnishAverage * 2) return 1;

      if (emissions <= finnishAverage) {
        return Math.round(60 + 40 * (1 - emissions / finnishAverage));
      } else {
        return Math.round(Math.max(1, 60 * (1 - (emissions - finnishAverage) / finnishAverage)));
      }
    };

    setResults({
      totalEmissions: formData.displayMode === "monthly" ? totalEmissions / 12 : totalEmissions,
      heatingEmissions: formData.displayMode === "monthly" ? heatingEmissions / 12 : heatingEmissions,
      electricityEmissions: formData.displayMode === "monthly" ? electricityEmissions / 12 : electricityEmissions,
      wastewaterEmissions: formData.displayMode === "monthly" ? wastewaterEmissions / 12 : wastewaterEmissions,
      transportEmissions: formData.displayMode === "monthly" ? transportEmissions / 12 : transportEmissions,
      groceryEmissions: formData.displayMode === "monthly" ? groceryEmissions / 12 : groceryEmissions,
      netZeroScore: calculateNetZeroScore(totalEmissions),
      emissionRating: getEmissionRating(perM2Emissions),
      perPersonEmissions,
      perM2Emissions,
    });
  };

  // Part 3: Vehicle Management and UI Helper Functions
  const addVehicle = () => {
    const newVehicle = {
      id: Date.now(),
      type: "car",
      fuelType: "petrol",
      kilometers: 1000,
      period: "monthly",
      customEmissions: "",
      name: `Vehicle ${formData.vehicles.length + 1}`,
    };
    setFormData((prev) => ({
      ...prev,
      vehicles: [...prev.vehicles, newVehicle],
    }));
  };

  const removeVehicle = (id) => {
    setFormData((prev) => ({
      ...prev,
      vehicles: prev.vehicles.filter((v) => v.id !== id),
    }));
  };

  const updateVehicle = (id, field, value) => {
    setFormData((prev) => ({
      ...prev,
      vehicles: prev.vehicles.map((v) =>
        v.id === id ? { ...v, [field]: value } : v
      ),
    }));
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "#10b981";
    if (score >= 70) return "#84cc16";
    if (score >= 60) return "#f59e0b";
    if (score >= 40) return "#f97316";
    return "#ef4444";
  };

  const getScoreLabel = (score) => {
    if (score >= 90) return "Excellent";
    if (score >= 80) return "Very Good";
    if (score >= 70) return "Good";
    if (score >= 60) return "Average";
    if (score >= 40) return "Below Average";
    return "Poor";
  };

  const CircularScore = ({ score }) => {
    const radius = 80;
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    return (
      <div className="relative w-48 h-48 mx-auto">
        <svg
          className="w-full h-full transform -rotate-90"
          viewBox="0 0 200 200"
        >
          <circle
            cx="100"
            cy="100"
            r={radius}
            stroke="#e5e7eb"
            strokeWidth="12"
            fill="none"
          />
          <circle
            cx="100"
            cy="100"
            r={radius}
            stroke={getScoreColor(score)}
            strokeWidth="12"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-4xl font-bold text-gray-800">{score}</div>
          <div className="text-sm text-gray-600 text-center">
            <div>Net Zero Score</div>
            <div
              className="font-semibold"
              style={{ color: getScoreColor(score) }}
            >
              {getScoreLabel(score)}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Calculator Page Component  
  const CalculatorPage = () => (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
	{/* Navigation */}
        <nav className="flex justify-between items-center mb-8 py-4">
          <button
            onClick={() => setCurrentPage("home")}
            className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
          >
            <Home className="w-5 h-5 mr-2" />
            Back to Home
          </button>
         
        </nav>
      {/* Copyright Notice */}
      <div className="bg-blue-100 border-l-4 border-blue-500 p-4 mb-6 rounded-r-lg">
        <div className="flex items-start">
          <Info className="mr-3 mt-0.5 text-blue-600" size={20} />
          <div className="text-sm text-blue-800">
            <div className="font-semibold mb-1">© NetZeroKoti, Finland</div>
            <div className="mb-2">
              This calculator is the property of{" "}
              <strong>NetZeroKoti, Finland</strong>. It is provided for
              educational purposes only and may not be copied, reproduced, or
              distributed without proper permissions from NetZeroKoti.
            </div>
            <div className="text-xs">
              For permissions and inquiries, contact us at:
              <a
                href="mailto:netzerokoti@gmail.com"
                className="font-medium underline ml-1"
              >
                netzerokoti@gmail.com
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Finnish Household CO₂ Emissions Calculator
          </h1>
          <p className="text-gray-600">
            Calculate your carbon footprint from heating, electricity,
            transport, and groceries
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-blue-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <Home className="mr-2" size={20} />
                House & Heating
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    House Type
                  </label>
                  <select
                    value={formData.houseType}
                    onChange={(e) =>
                      handleInputChange("houseType", e.target.value)
                    }
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="detached">Detached</option>
                    <option value="semi-detached">Semi-detached</option>
                    <option value="row">Row House</option>
                    <option value="apartment">Apartment</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Area (m²)
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="1000"
                    value={formData.builtArea}
                    onChange={(e) =>
                      handleInputChange(
                        "builtArea",
                        parseInt(e.target.value) || 0
                      )
                    }
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Built Year
                  </label>
                  <input
                    type="number"
                    min="1900"
                    max="2025"
                    value={formData.constructionYear}
                    onChange={(e) =>
                      handleInputChange(
                        "constructionYear",
                        parseInt(e.target.value) || 2000
                      )
                    }
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Residents
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.residents}
                    onChange={(e) =>
                      handleInputChange(
                        "residents",
                        parseInt(e.target.value) || 1
                      )
                    }
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Heating
                  </label>
                  <select
                    value={formData.heatingSystem}
                    onChange={(e) =>
                      handleInputChange("heatingSystem", e.target.value)
                    }
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="district">District</option>
                    <option value="electric">Electric</option>
                    <option value="oil">Oil</option>
                    <option value="geothermal">Geothermal</option>
                  </select>
                </div>

                {formData.heatingSystem === "district" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City
                    </label>
                    <select
                      value={formData.districtLocation}
                      onChange={(e) =>
                        handleInputChange("districtLocation", e.target.value)
                      }
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="espoo">Espoo</option>
                      <option value="helsinki">Helsinki</option>
                      <option value="vantaa">Vantaa</option>
                      <option value="tampere">Tampere</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-blue-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <Droplets className="mr-2" size={20} />
                Water Consumption
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hot Water (m³)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.hotWaterReading}
                    onChange={(e) =>
                      handleInputChange("hotWaterReading", e.target.value)
                    }
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    placeholder="Optional"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cold Water (m³)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.coldWaterReading}
                    onChange={(e) =>
                      handleInputChange("coldWaterReading", e.target.value)
                    }
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    placeholder="Optional"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Period
                  </label>
                  <select
                    value={formData.waterPeriod}
                    onChange={(e) =>
                      handleInputChange("waterPeriod", e.target.value)
                    }
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="semi-annual">Semi-annual</option>
                    <option value="annual">Annual</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <Zap className="mr-2" size={20} />
                Electricity
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Provider
                  </label>
                  <select
                    value={formData.electricityProvider}
                    onChange={(e) =>
                      handleInputChange("electricityProvider", e.target.value)
                    }
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="fortum">Fortum</option>
                    <option value="helen">Helen</option>
                    <option value="vantaan">Vantaan Energia</option>
                    <option value="tampere">Tampereen Energia</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <select
                    value={formData.productType}
                    onChange={(e) =>
                      handleInputChange("productType", e.target.value)
                    }
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="standard">Standard</option>
                    <option value="renewable">Renewable</option>
                    <option value="nuclear">Nuclear</option>
                    <option value="nuclearMix">Nuclear Mix</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    kWh
                  </label>
                  <input
                    type="number"
                    value={formData.electricityConsumption}
                    onChange={(e) =>
                      handleInputChange(
                        "electricityConsumption",
                        parseInt(e.target.value) || 0
                      )
                    }
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Period
                  </label>
                  <select
                    value={formData.consumptionPeriod}
                    onChange={(e) =>
                      handleInputChange("consumptionPeriod", e.target.value)
                    }
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>
            </div>
                    <div className="bg-green-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <Car className="mr-2" size={20} />
                Transport
              </h2>

              <div className="space-y-4">
                {formData.vehicles.map((vehicle) => (
                  <div
                    key={vehicle.id}
                    className="bg-white p-4 rounded-lg border"
                  >
                    <div className="flex justify-between items-center mb-3">
                      <input
                        type="text"
                        value={vehicle.name}
                        onChange={(e) =>
                          updateVehicle(vehicle.id, "name", e.target.value)
                        }
                        className="font-medium bg-transparent border-none p-0 focus:outline-none"
                      />
                      <button
                        onClick={() => removeVehicle(vehicle.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Type
                        </label>
                        <select
                          value={vehicle.type}
                          onChange={(e) =>
                            updateVehicle(vehicle.id, "type", e.target.value)
                          }
                          className="w-full p-2 text-sm border border-gray-300 rounded-md"
                        >
                          <option value="car">Car</option>
                          <option value="motorcycle">Motorcycle</option>
                          <option value="bike">Bike</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Fuel/Size
                        </label>
                        <select
                          value={vehicle.fuelType}
                          onChange={(e) =>
                            updateVehicle(
                              vehicle.id,
                              "fuelType",
                              e.target.value
                            )
                          }
                          className="w-full p-2 text-sm border border-gray-300 rounded-md"
                        >
                          {vehicle.type === "car" && (
                            <>
                              <option value="petrol">Petrol</option>
                              <option value="diesel">Diesel</option>
                              <option value="hybrid">Hybrid</option>
                              <option value="phev">PHEV</option>
                              <option value="bev">Electric</option>
                            </>
                          )}
                          {vehicle.type === "motorcycle" && (
                            <>
                              <option value="under125cc">Under 125cc</option>
                              <option value="125to250cc">125-250cc</option>
                              <option value="250to500cc">250-500cc</option>
                              <option value="500to1000cc">500-1000cc</option>
                              <option value="over1000cc">Over 1000cc</option>
                              <option value="electric">Electric</option>
                            </>
                          )}
                          {vehicle.type === "bike" && (
                            <>
                              <option value="manual">Manual</option>
                              <option value="electric">E-bike</option>
                            </>
                          )}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          km
                        </label>
                        <input
                          type="number"
                          value={vehicle.kilometers}
                          onChange={(e) =>
                            updateVehicle(
                              vehicle.id,
                              "kilometers",
                              parseInt(e.target.value) || 0
                            )
                          }
                          className="w-full p-2 text-sm border border-gray-300 rounded-md"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Period
                        </label>
                        <select
                          value={vehicle.period}
                          onChange={(e) =>
                            updateVehicle(vehicle.id, "period", e.target.value)
                          }
                          className="w-full p-2 text-sm border border-gray-300 rounded-md"
                        >
                          <option value="monthly">Monthly</option>
                          <option value="yearly">Yearly</option>
                        </select>
                      </div>

                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Custom CO₂ (g/km)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={vehicle.customEmissions}
                          onChange={(e) =>
                            updateVehicle(
                              vehicle.id,
                              "customEmissions",
                              e.target.value
                            )
                          }
                          className="w-full p-2 text-sm border border-gray-300 rounded-md"
                          placeholder="Optional override"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  onClick={addVehicle}
                  className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 flex items-center justify-center"
                >
                  <Plus className="mr-2" size={16} />
                  Add Vehicle
                </button>
              </div>
            </div>

            {/* NEW: Enhanced Grocery Emissions Section with Receipt Analysis */}
            <div className="bg-orange-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <ShoppingCart className="mr-2" size={20} />
                Grocery Emissions
              </h2>

              <div className="space-y-4">
                {/* Method Selection */}
                <div className="grid grid-cols-1 gap-3">
                  <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-white">
                    <input
                      type="radio"
                      name="groceryMethod"
                      value="loyalty"
                      checked={formData.groceryMethod === "loyalty"}
                      onChange={(e) => handleInputChange("groceryMethod", e.target.value)}
                      className="mr-3"
                    />
                    <div>
                      <div className="font-medium">Loyalty Card Data</div>
                      <div className="text-xs text-gray-600">
                        K-Plussa, S-Bonus CO₂ data
                      </div>
                    </div>
                  </label>

                  <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-white">
                    <input
                      type="radio"
                      name="groceryMethod"
                      value="spending"
                      checked={formData.groceryMethod === "spending"}
                      onChange={(e) => handleInputChange("groceryMethod", e.target.value)}
                      className="mr-3"
                    />
                    <div>
                      <div className="font-medium">Spending-Based</div>
                      <div className="text-xs text-gray-600">
                        Calculate from spending amount
                      </div>
                    </div>
                  </label>

                  {/* NEW: Receipt Analysis Option */}
                  <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-white">
                    <input
                      type="radio"
                      name="groceryMethod"
                      value="receipt-analysis"
                      checked={formData.groceryMethod === "receipt-analysis"}
                      onChange={(e) => handleInputChange("groceryMethod", e.target.value)}
                      className="mr-3"
                    />
                    <div>
                      <div className="font-medium">AI Receipt Analysis</div>
                      <div className="text-xs text-gray-600">
                        Upload receipts for AI-powered carbon footprint analysis
                      </div>
                    </div>
                  </label>
                </div>

                {/* Existing Loyalty Card Method */}
                {formData.groceryMethod === "loyalty" && (
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          CO₂ (kg)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={formData.groceryCO2}
                          onChange={(e) => handleInputChange("groceryCO2", e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                          placeholder="From app"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Period
                        </label>
                        <select
                          value={formData.groceryPeriod}
                          onChange={(e) => handleInputChange("groceryPeriod", e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="monthly">Monthly</option>
                          <option value="annual">Annual</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Existing Spending-Based Method */}
                {formData.groceryMethod === "spending" && (
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Spending (€)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.grocerySpend}
                          onChange={(e) => handleInputChange("grocerySpend", e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                          placeholder="Amount"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Period
                        </label>
                        <select
                          value={formData.grocerySpendPeriod}
                          onChange={(e) => handleInputChange("grocerySpendPeriod", e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="monthly">Monthly</option>
                          <option value="annual">Annual</option>
                        </select>
                      </div>

                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Diet Type
                        </label>
                        <select
                          value={formData.dietType}
                          onChange={(e) => {
                            handleInputChange("dietType", e.target.value);
                            handleInputChange("emissionFactor", getDietEmissionFactor(e.target.value));
                          }}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="meat-heavy">Meat-heavy (1.4 kg CO₂/€)</option>
                          <option value="balanced">Balanced omnivore (0.85 kg CO₂/€)</option>
                          <option value="vegetarian">Mostly vegetarian (0.6 kg CO₂/€)</option>
                          <option value="vegan">Plant-based/vegan (0.4 kg CO₂/€)</option>
                          <option value="national">National average (0.7 kg CO₂/€)</option>
                        </select>
                      </div>

                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Custom Factor (kg CO₂/€) - Optional
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={formData.emissionFactor}
                          onChange={(e) => handleInputChange("emissionFactor", e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                          placeholder={`Default for ${formData.dietType}: ${getDietEmissionFactor(formData.dietType)} kg CO₂/€`}
                        />
                      </div>
                    </div>

                    {formData.grocerySpend && (
                      <div className="mt-3 p-2 bg-gray-50 rounded text-sm text-gray-600">
                        Annual estimate:{" "}
                        {(() => {
                          const spend = parseFloat(formData.grocerySpend) || 0;
                          const factor = formData.emissionFactor && formData.emissionFactor !== ""
                            ? parseFloat(formData.emissionFactor)
                            : getDietEmissionFactor(formData.dietType);
                          const annualSpend = formData.grocerySpendPeriod === "monthly" ? spend * 12 : spend;
                          return (annualSpend * factor).toFixed(1);
                        })()}{" "}
                        kg CO₂/year
                      </div>
                    )}
                  </div>
                )}

                {/* NEW: Receipt Analysis Method */}
                {formData.groceryMethod === "receipt-analysis" && (
                  <div className="bg-white p-4 rounded-lg border space-y-4">
                    {/* API Configuration */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Railway API URL
                      </label>
                      <input
                        type="url"
                        value={formData.receiptAnalysisApiUrl}
                        onChange={(e) => handleInputChange("receiptAnalysisApiUrl", e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                        placeholder="https://your-app.up.railway.app"
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        Enter your Railway API URL for receipt analysis
                      </div>
                    </div>

                    {/* Upload Section */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowReceiptModal(true)}
                        className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center"
                        disabled={!formData.receiptAnalysisApiUrl}
                      >
                        <Plus className="mr-2" size={16} />
                        Upload Receipt
                      </button>
                      <button
                        onClick={importReceiptData}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center"
                        disabled={formData.uploadedReceipts.length === 0}
                      >
                        <Download className="mr-2" size={16} />
                        Import Data
                      </button>
                    </div>

                    {/* Period Selection for Receipt Analysis */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Analysis Period
                      </label>
                      <select
                        value={formData.receiptAnalysisPeriod}
                        onChange={(e) => handleInputChange("receiptAnalysisPeriod", e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="monthly">Monthly</option>
                        <option value="annual">Annual</option>
                      </select>
                      <div className="text-xs text-gray-500 mt-1">
                        How to interpret the uploaded receipts data
                      </div>
                    </div>

                    {/* Receipt List */}
                    {formData.uploadedReceipts.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <h4 className="font-medium text-gray-800">Uploaded Receipts</h4>
                          <div className="text-sm text-gray-600">
                            Total: {formData.receiptTotalEmissions.toFixed(1)} kg CO₂
                          </div>
                        </div>
                        
                        <div className="max-h-40 overflow-y-auto space-y-2">
                          {formData.uploadedReceipts.map((receipt) => (
                            <div key={receipt.id} className="bg-gray-50 p-3 rounded-lg">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="font-medium text-sm">{receipt.storeName}</div>
                                  <div className="text-xs text-gray-600">
                                    {receipt.date} • {receipt.itemCount} items • €{receipt.totalPrice.toFixed(2)}
                                  </div>
                                  <div className="text-sm font-medium text-green-600">
                                    {receipt.totalEmissions.toFixed(1)} kg CO₂
                                  </div>
                                </div>
                                <button
                                  onClick={() => removeReceipt(receipt.id)}
                                  className="text-red-500 hover:text-red-700 ml-2"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Current Values Display */}
                    {formData.groceryCO2 && (
                      <div className="bg-green-50 p-3 rounded-lg">
                        <div className="text-sm font-medium text-green-800">
                          Current grocery emissions: {formData.groceryCO2} kg CO₂/{formData.groceryPeriod}
                        </div>
                        <div className="text-xs text-green-600 mt-1">
                          This data will be used in your total emissions calculation
                        </div>
                      </div>
                    )}

                    {/* Instructions */}
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="text-sm text-blue-800">
                        <div className="font-medium mb-1">How it works:</div>
                        <div className="text-xs space-y-1">
                          <div>1. Configure your Railway API URL</div>
                          <div>2. Upload receipt images or PDFs</div>
                          <div>3. AI analyzes and calculates CO₂ emissions</div>
                          <div>4. Click "Import Data" to use in calculations</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Receipt Upload Modal */}
          <ReceiptUploadModal 
            isOpen={showReceiptModal}
            onClose={() => setShowReceiptModal(false)}
            onReceiptAnalyzed={handleReceiptAnalyzed}
            apiUrl={formData.receiptAnalysisApiUrl}
          />
          <div className="space-y-6">
            <div className="bg-white border-2 border-gray-200 rounded-lg p-6 text-center">
              <CircularScore score={results.netZeroScore} />
              <div className="mt-4 text-sm text-gray-600">
                <div>Finnish Average: 60 points</div>
                <div>Your Score: {results.netZeroScore} points</div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Results
              </h2>

              <div className="space-y-4">
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {results.totalEmissions.toFixed(0)} kg CO₂
                    {formData.displayMode === "monthly" ? "/month" : "/year"}
                  </div>
                  <div className="text-sm text-gray-600">Total Emissions</div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-orange-50 p-3 rounded text-center">
                    <div className="font-semibold text-orange-600">
                      {results.heatingEmissions.toFixed(0)} kg
                    </div>
                    <div className="text-gray-600">Heating</div>
                  </div>
                  <div className="bg-yellow-50 p-3 rounded text-center">
                    <div className="font-semibold text-yellow-600">
                      {results.electricityEmissions.toFixed(0)} kg
                    </div>
                    <div className="text-gray-600">Electricity</div>
                  </div>
                  <div className="bg-green-50 p-3 rounded text-center">
                    <div className="font-semibold text-green-600">
                      {results.transportEmissions.toFixed(0)} kg
                    </div>
                    <div className="text-gray-600">Transport</div>
                  </div>
                  <div className="bg-purple-50 p-3 rounded text-center">
                    <div className="font-semibold text-purple-600">
                      {results.groceryEmissions.toFixed(0)} kg
                    </div>
                    <div className="text-gray-600">Groceries</div>
                  </div>
                  <div className="bg-blue-50 p-3 rounded text-center col-span-2">
                    <div className="font-semibold text-blue-600">
                      {results.wastewaterEmissions.toFixed(0)} kg
                    </div>
                    <div className="text-gray-600">Wastewater</div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="grid grid-cols-3 gap-4 text-sm text-center">
                    <div>
                      <div className="font-semibold">Rating</div>
                      <div className="text-2xl font-bold text-blue-600">
                        {results.emissionRating}
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold">Per Person</div>
                      <div className="text-lg">
                        {results.perPersonEmissions.toFixed(0)} kg
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold">Per m²</div>
                      <div className="text-lg">
                        {results.perM2Emissions.toFixed(1)} kg
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                vs Finnish Average
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Your emissions:</span>
                  <span className="font-semibold">
                    {(formData.displayMode === "monthly"
                      ? results.totalEmissions * 12
                      : results.totalEmissions
                    ).toFixed(0)}{" "}
                    kg/year
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Finnish average:</span>
                  <span className="font-semibold">4,200 kg/year</span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="font-semibold">Difference:</span>
                  <span
                    className={`font-bold ${
                      (formData.displayMode === "monthly"
                        ? results.totalEmissions * 12
                        : results.totalEmissions) < 4200
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {(
                      (formData.displayMode === "monthly"
                        ? results.totalEmissions * 12
                        : results.totalEmissions) - 4200
                    ).toFixed(0)}{" "}
                    kg/year
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowComparison(!showComparison)}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center"
              >
                <BarChart3 className="mr-2" size={18} />
                {showComparison ? "Hide" : "Show"} Compare
              </button>
              <button
                onClick={() => alert("PDF export feature coming soon!")}
                className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center justify-center"
              >
                <Download className="mr-2" size={18} />
                Export
              </button>
            </div>

            {showComparison && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Improvement Scenarios
                </h3>
                <div className="space-y-3">
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="font-semibold text-gray-800">
                      Renewable Electricity
                    </div>
                    <div className="text-green-600">
                      Save: -{results.electricityEmissions.toFixed(0)} kg
                      CO₂/year
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="font-semibold text-gray-800">
                      Electric Vehicles
                    </div>
                    <div className="text-green-600">
                      Save: -{results.transportEmissions.toFixed(0)} kg CO₂/year
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="font-semibold text-gray-800">
                      Reduce Meat 30%
                    </div>
                    <div className="text-green-600">
                      Save: -{(results.groceryEmissions * 0.3).toFixed(0)} kg
                      CO₂/year
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="font-semibold text-gray-800">
                      Energy Renovation
                    </div>
                    <div className="text-green-600">
                      Save: -{(results.heatingEmissions * 0.4).toFixed(0)} kg
                      CO₂/year
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="font-semibold text-gray-800">
                      AI-Optimized Grocery Shopping
                    </div>
                    <div className="text-green-600">
                      Save: -{(results.groceryEmissions * 0.2).toFixed(0)} kg
                      CO₂/year
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      Using receipt analysis to identify high-emission items
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                <Info className="mr-2" size={18} />
                Understanding Your Results
              </h3>
              <div className="text-sm text-gray-700 space-y-2">
                <p>
                  <strong>Heating:</strong> Based on building age and area.
                  Newer buildings are more efficient.
                </p>
                <p>
                  <strong>Electricity:</strong> Varies by provider. Renewable
                  options have zero emissions.
                </p>
                <p>
                  <strong>Transport:</strong> Calculated from vehicles and
                  usage. Electric vehicles are cleanest.
                </p>
                <p>
                  <strong>Groceries:</strong> From loyalty card data, spending
                  × emission factor, or AI receipt analysis for precise tracking.
                </p>
                <p>
                  <strong>AI Receipt Analysis:</strong> Upload grocery receipts for 
                  item-level carbon footprint analysis and personalized suggestions.
                </p>
                <p>
                  <strong>Score:</strong> 100 = zero emissions, 60 = Finnish
                  average, 1 = very high.
                </p>
              </div>
            </div>

            {/* New: Receipt Analysis Summary */}
            {formData.groceryMethod === "receipt-analysis" && formData.uploadedReceipts.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <FileText className="mr-2" size={18} />
                  Receipt Analysis Summary
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-medium text-gray-700">Total Receipts</div>
                    <div className="text-lg font-bold text-green-600">
                      {formData.uploadedReceipts.length}
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-700">Total Items</div>
                    <div className="text-lg font-bold text-green-600">
                      {formData.uploadedReceipts.reduce((sum, receipt) => sum + receipt.itemCount, 0)}
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-700">Total Spending</div>
                    <div className="text-lg font-bold text-green-600">
                      €{formData.uploadedReceipts.reduce((sum, receipt) => sum + receipt.totalPrice, 0).toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-700">Average CO₂/€</div>
                    <div className="text-lg font-bold text-green-600">
                      {(formData.receiptTotalEmissions / 
                        formData.uploadedReceipts.reduce((sum, receipt) => sum + receipt.totalPrice, 0)).toFixed(2)} kg
                    </div>
                  </div>
                </div>
                
                {/* Top stores */}
                {formData.uploadedReceipts.length > 1 && (
                  <div className="mt-4">
                    <div className="font-medium text-gray-700 mb-2">Stores Analyzed</div>
                    <div className="flex flex-wrap gap-2">
                      {[...new Set(formData.uploadedReceipts.map(r => r.storeName))].map((store, index) => (
                        <span key={index} className="px-2 py-1 bg-white rounded text-xs text-gray-600 border">
                          {store}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* New: Quick Tips based on method */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                <Camera className="mr-2" size={18} />
                💡 Tips for Better Tracking
              </h3>
              <div className="text-sm text-gray-700 space-y-2">
                {formData.groceryMethod === "receipt-analysis" ? (
                  <div>
                    <p><strong>Receipt Analysis Tips:</strong></p>
                    <ul className="list-disc list-inside space-y-1 text-xs ml-4">
                      <li>Upload receipts regularly for accurate monthly tracking</li>
                      <li>Clear photos work better than blurry images</li>
                      <li>PDF receipts from email provide the most accurate data</li>
                      <li>Review AI suggestions to reduce high-emission items</li>
                    </ul>
                  </div>
                ) : formData.groceryMethod === "loyalty" ? (
                  <div>
                    <p><strong>Loyalty Card Tips:</strong></p>
                    <ul className="list-disc list-inside space-y-1 text-xs ml-4">
                      <li>Check K-Plussa or S-Bonus apps for CO₂ data</li>
                      <li>Update monthly for accurate tracking</li>
                      <li>Some stores provide detailed emission breakdowns</li>
                    </ul>
                  </div>
                ) : (
                  <div>
                    <p><strong>Spending-Based Tips:</strong></p>
                    <ul className="list-disc list-inside space-y-1 text-xs ml-4">
                      <li>Track your grocery spending for more accuracy</li>
                      <li>Adjust diet type if your eating habits change</li>
                      <li>Consider switching to receipt analysis for precise tracking</li>
                    </ul>
                  </div>
                )}
                
                <div className="mt-3 pt-3 border-t border-yellow-300">
                  <p className="font-medium">Want more accuracy?</p>
                  <p className="text-xs">
                    {formData.groceryMethod !== "receipt-analysis" 
                      ? "Try our AI Receipt Analysis for item-level carbon tracking!"
                      : "Great choice! Receipt analysis provides the most accurate grocery emissions data."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Homepage Component
  const NetZeroKotiHomepage = () => {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
        {/* Navigation */}
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center">
                <Home className="w-8 h-8 text-green-600 mr-3" />
                <span className="text-2xl font-bold text-gray-900">NetZeroKoti</span>
              </div>
              <button onClick={() => window.open("https://netzerokoti.com/", "_blank")}
				className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium">			  
                Visit Our Main Site
              </button>
            </div>
          </div>
        </nav>
  
        {/* Hero Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-16">
            <div className="flex justify-center items-center mb-6">
              <Home className="w-20 h-20 text-green-600 mr-4" />
              <h1 className="text-6xl font-bold text-gray-900">NetZeroKoti</h1>
            </div>
            <h2 className="text-3xl text-gray-700 mb-6 font-bold">
              Advanced Finnish Household CO₂ Emissions Calculator
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-4xl mx-auto leading-relaxed">
              Take control of your carbon footprint with Finland's most comprehensive household emissions calculator. 
              Get precise, municipality-specific analysis and actionable insights to reduce your environmental impact.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button onClick={() => setCurrentPage("calculator")}
			  className="flex items-center justify-center px-10 py-4 bg-green-600 text-white text-xl rounded-lg hover:bg-green-700 transition-colors font-bold shadow-lg">                               
				<Calculator className="w-6 h-6 mr-3" />
                Start Your Analysis
                <ArrowRight className="w-6 h-6 ml-3" />
              </button>              
            </div>
          </div>
  
          {/* Key Features */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
            <div className="text-center p-8 bg-white rounded-2xl shadow-xl border border-gray-100 hover:shadow-2xl transition-shadow">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Calculator className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                🧮 Comprehensive Analysis
              </h3>
              <p className="text-gray-600 leading-relaxed text-lg">
                Calculate combined heating and electricity emissions with Finnish-specific data and detailed municipality factors for accurate results.
              </p>
            </div>
            
            <div className="text-center p-8 bg-white rounded-2xl shadow-xl border border-gray-100 hover:shadow-2xl transition-shadow">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Target className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                🎯 Local Accuracy
              </h3>
              <p className="text-gray-600 leading-relaxed text-lg">
                Municipality-specific district heating factors for Helsinki, Espoo, Vantaa, Tampere, and more Finnish cities for precise calculations.
              </p>
            </div>
            
            <div className="text-center p-8 bg-white rounded-2xl shadow-xl border border-gray-100 hover:shadow-2xl transition-shadow">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <BarChart3 className="w-10 h-10 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                📊 Actionable Insights
              </h3>
              <p className="text-gray-600 leading-relaxed text-lg">
                Compare different energy systems, providers, and receive specific recommendations for emission reduction tailored to your home.
              </p>
            </div>
            
            <div className="text-center p-8 bg-white rounded-2xl shadow-xl border border-gray-100 hover:shadow-2xl transition-shadow">
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <GraduationCap className="w-10 h-10 text-orange-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                🎓 Educational Tool
              </h3>
              <p className="text-gray-600 leading-relaxed text-lg">
                Learn about Finnish energy systems and understand the real impact of your choices on carbon emissions and climate goals.
              </p>
            </div>
          </div>
  
          {/* Why It Matters Section */}
          <div className="bg-white rounded-3xl shadow-2xl p-10 mb-20">
            <h2 className="text-4xl font-bold text-center text-gray-900 mb-16">
              Why NetZeroKoti Matters for Finnish Households
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <CheckCircle className="w-8 h-8 text-green-600 mt-1" />
                </div>
                <div>
                  <p className="text-gray-700 leading-relaxed text-lg">
                    <span className="font-bold text-xl">Home heating accounts for 60-70% of household energy use</span> in Finland's climate
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <CheckCircle className="w-8 h-8 text-green-600 mt-1" />
                </div>
                <div>
                  <p className="text-gray-700 leading-relaxed text-lg">
                    <span className="font-bold text-xl">District heating varies dramatically by municipality</span> - from 15g to 300g CO₂/kWh
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <CheckCircle className="w-8 h-8 text-green-600 mt-1" />
                </div>
                <div>
                  <p className="text-gray-700 leading-relaxed text-lg">
                    <span className="font-bold text-xl">Finnish households average 4.2 tons CO₂e annually</span> from home energy alone
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <CheckCircle className="w-8 h-8 text-green-600 mt-1" />
                </div>
                <div>
                  <p className="text-gray-700 leading-relaxed text-lg">
                    <span className="font-bold text-xl">Smart energy choices can reduce emissions by 40-60%</span> with proper planning
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <CheckCircle className="w-8 h-8 text-green-600 mt-1" />
                </div>
                <div>
                  <p className="text-gray-700 leading-relaxed text-lg">
                    <span className="font-bold text-xl">Government net-zero targets require 80% emission cuts</span> by 2050
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <CheckCircle className="w-8 h-8 text-green-600 mt-1" />
                </div>
                <div>
                  <p className="text-gray-700 leading-relaxed text-lg">
                    <span className="font-bold text-xl">Energy certificates don't show actual carbon footprint</span> - our tool does
                  </p>
                </div>
              </div>
            </div>
          </div>
  
          {/* Stats Section */}
          <div className="bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 text-white rounded-3xl shadow-2xl p-12 mb-20">
            <div className="grid md:grid-cols-4 gap-8 text-center">
              <div className="transform hover:scale-105 transition-transform">
                <div className="text-6xl font-bold mb-4">±5%</div>
                <p className="text-xl font-semibold opacity-90">Calculation Accuracy</p>
              </div>
              <div className="transform hover:scale-105 transition-transform">
                <div className="text-6xl font-bold mb-4">4.2t</div>
                <p className="text-xl font-semibold opacity-90">Finnish Average</p>
              </div>
              <div className="transform hover:scale-105 transition-transform">
                <div className="text-6xl font-bold mb-4">A-G</div>
                <p className="text-xl font-semibold opacity-90">Rating Scale</p>
              </div>
              <div className="transform hover:scale-105 transition-transform">
                <div className="text-6xl font-bold mb-4">4+</div>
                <p className="text-xl font-semibold opacity-90">Municipalities</p>
              </div>
            </div>
          </div>
  
          {/* How It Works */}
          <div className="bg-white rounded-3xl shadow-2xl p-10 mb-20">
            <h2 className="text-4xl font-bold text-center text-gray-900 mb-16">
              How NetZeroKoti Works
            </h2>
            
            <div className="grid md:grid-cols-4 gap-8">
              <div className="text-center group">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-blue-200 transition-colors">
                  <Building2 className="w-10 h-10 text-blue-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-4 text-xl">1. Home Details</h3>
                <p className="text-gray-600 leading-relaxed text-lg">
                  Enter your home size, type, and location for accurate baseline calculations
                </p>
              </div>
              
              <div className="text-center group">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-green-200 transition-colors">
                  <Thermometer className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-4 text-xl">2. Energy Systems</h3>
                <p className="text-gray-600 leading-relaxed text-lg">
                  Select your heating and electricity sources with municipality-specific factors
                </p>
              </div>
              
              <div className="text-center group">
                <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-purple-200 transition-colors">
                  <BarChart3 className="w-10 h-10 text-purple-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-4 text-xl">3. Analysis</h3>
                <p className="text-gray-600 leading-relaxed text-lg">
                  Get detailed emissions breakdown and comparison with Finnish averages
                </p>
              </div>
              
              <div className="text-center group">
                <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-orange-200 transition-colors">
                  <TrendingDown className="w-10 h-10 text-orange-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-4 text-xl">4. Recommendations</h3>
                <p className="text-gray-600 leading-relaxed text-lg">
                  Receive personalized action plan to reduce your household emissions
                </p>
              </div>
            </div>
          </div>
  
          {/* CTA Section */}
          <div className="text-center bg-gradient-to-br from-green-50 to-blue-50 rounded-3xl shadow-2xl p-16 border-2 border-green-200">
            <div className="flex justify-center items-center mb-8">
              <Leaf className="w-16 h-16 text-green-600 mr-4" />
              <h2 className="text-5xl font-bold text-gray-900">
                Ready to Achieve Net Zero?
              </h2>
            </div>
            <p className="text-2xl text-gray-600 mb-12 max-w-4xl mx-auto font-medium">
              Join thousands of Finnish households taking control of their carbon footprint. 
              Start your comprehensive emissions analysis today.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <button onClick={() => setCurrentPage("calculator")} className="px-16 py-6 bg-green-600 text-white text-2xl rounded-xl hover:bg-green-700 transition-colors font-bold shadow-xl hover:shadow-2xl transform hover:scale-105">
                Calculate My Emissions
              </button>
              <button onClick={() => window.open("https://netzerokoti.com/", "_blank")}
			  className="px-16 py-6 bg-blue-600 text-white text-2xl rounded-xl hover:bg-blue-700 transition-colors font-bold shadow-xl hover:shadow-2xl transform hover:scale-105">
                Learn More
              </button>
            </div>
          </div>
        </div>
  
        {/* Footer */}
        <footer className="bg-gray-900 text-white mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center">
              <div className="flex justify-center items-center mb-6">
                <Home className="w-10 h-10 text-green-400 mr-4" />
                <span className="text-3xl font-bold">NetZeroKoti</span>
              </div>
              <p className="text-gray-300 mb-8 text-xl max-w-2xl mx-auto">
                Empowering Finnish households to achieve net-zero emissions through data-driven insights and actionable recommendations.
              </p>
              <div className="flex justify-center space-x-8 text-lg text-gray-400">
				<button 
	                onClick={() => setCurrentPage("privacy")}
	                className="hover:text-white transition-colors font-medium bg-transparent border-none text-lg cursor-pointer"
	              >
	                Privacy Policy
	            </button>
                <a href="https://netzerokoti.com/" className="hover:text-white transition-colors font-medium">Contact</a>
                <a href="https://netzerokoti.com/" className="hover:text-white transition-colors font-medium">About</a>
              </div>
              <div className="mt-8 pt-8 border-t border-gray-700">
                <p className="text-gray-500">© 2025 NetZeroKoti. All rights reserved.</p>
              </div>
            </div>
          </div>
        </footer>
      </div>
    );
  };

// Privacy Policy Page Component
const PrivacyPolicyPage = () => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
    <div className="max-w-4xl mx-auto p-4">
      {/* Navigation */}
      <nav className="flex justify-between items-center mb-8 py-4">
        <button
          onClick={() => setCurrentPage("home")}
          className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
        >
          <Home className="w-5 h-5 mr-2" />
          Back to Home
        </button>
        <div className="flex items-center">
          <Leaf className="w-8 h-8 text-green-600 mr-2" />
          <span className="text-xl font-bold text-gray-800">EcoReceipt Privacy Policy</span>
        </div>
      </nav>

      {/* Privacy Policy Content */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="flex justify-center items-center mb-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <Settings className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Privacy Policy</h1>
          <h2 className="text-2xl font-semibold text-blue-600">EcoReceipt</h2>
          <p className="text-gray-600 mt-4">
            <strong>Effective Date:</strong> January 15, 2025
          </p>
        </div>

        <div className="prose prose-lg max-w-none text-gray-700">
          <div className="mb-8">
            <p className="text-lg leading-relaxed">
              At <strong>EcoReceipt</strong>, we respect your privacy and are committed to protecting your personal data. 
              This policy explains how we handle the receipts you upload to our service.
            </p>
          </div>

          <div className="mb-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
              <FileText className="w-6 h-6 text-green-600 mr-2" />
              What Data We Process
            </h3>
            <p className="mb-4">When you upload a receipt (photo or PDF) to EcoReceipt:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>We process the file to extract and classify each item for CO₂ scoring.</li>
              <li>We store only:
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>The classification result for each item.</li>
                  <li>The calculated CO₂ score for the receipt (NetZero score).</li>
                  <li>The store name from the receipt.</li>
                </ul>
              </li>
              <li>We do <strong>not</strong> store the uploaded image or PDF — it is deleted immediately after processing.</li>
              <li>We do <strong>not</strong> collect any other personal information from your receipt.</li>
            </ul>
          </div>

          <div className="mb-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
              <Brain className="w-6 h-6 text-purple-600 mr-2" />
              AI Processing Disclosure
            </h3>
            <p>
              EcoReceipt uses artificial intelligence (AI) to automatically recognize and classify items on your receipt 
              in order to calculate the CO₂ score. The AI processing is fully automated and operates only on the data 
              you choose to provide.
            </p>
          </div>

          <div className="mb-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
              <Target className="w-6 h-6 text-blue-600 mr-2" />
              How We Use the Data
            </h3>
            <p className="mb-4">We use the processed data to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide you with the CO₂ score of your purchases.</li>
              <li>Improve our classification models and accuracy (using only anonymized data).</li>
            </ul>
          </div>

          <div className="mb-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
              <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center mr-2">
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
              Data Security
            </h3>
            <p>
              We take reasonable technical and organizational measures to protect your data from unauthorized access, 
              use, or disclosure.
            </p>
          </div>

          <div className="mb-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
              <Globe className="w-6 h-6 text-indigo-600 mr-2" />
              Your Rights under GDPR
            </h3>
            <p className="mb-4">You have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Request access to the data we store about you.</li>
              <li>Request correction or deletion of your stored receipt data.</li>
              <li>Withdraw your consent at any time.</li>
            </ul>
            <p className="mt-4">
              To exercise your rights, contact us at: 
              <a href="mailto:netzerokoti@gmail.com" className="text-blue-600 hover:text-blue-800 font-medium ml-1">
                netzerokoti@gmail.com
              </a>
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center mr-2">
                <span className="text-white text-xs font-bold">@</span>
              </div>
              Contact
            </h3>
            <p className="mb-4">If you have questions about this policy, you can reach us at:</p>
            <div className="space-y-2">
              <p>
                <strong>Email:</strong> 
                <a href="mailto:netzerokoti@gmail.com" className="text-blue-600 hover:text-blue-800 font-medium ml-1">
                  netzerokoti@gmail.com
                </a>
              </p>
              <p>
                <strong>Website:</strong> 
                <a href="https://netzerokoti.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 font-medium ml-1">
                  https://netzerokoti.com
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Back to Home Button */}
        <div className="text-center mt-8">
          <button
            onClick={() => setCurrentPage("home")}
            className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  </div>
);

  // Main App Component
  return (
    <div>      
	  {currentPage === "home" && <NetZeroKotiHomepage />}
      {currentPage === "calculator" && <CalculatorPage />}
      {currentPage === "privacy" && <PrivacyPolicyPage />}
    </div>
  );
};

export default App;
