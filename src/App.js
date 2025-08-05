import React, { useState, useEffect } from "react";
import {
  Home,
  Zap,
  Droplets,
  Info,
  Download,
  BarChart3,
  Car,
  Plus,
  Trash2,
  ShoppingCart,
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
  });

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
      heatingFactor = heatingEmissionFactors.district(
        formData.districtLocation
      );
    } else {
      heatingFactor = heatingEmissionFactors[formData.heatingSystem];
    }
    const heatingEmissions = totalHeatingEnergy * heatingFactor;

    const electricityFactor =
      electricityEmissionFactors[formData.electricityProvider]?.[
        formData.productType
      ] || 234;
    const yearlyElectricityConsumption =
      formData.consumptionPeriod === "monthly"
        ? formData.electricityConsumption * 12
        : formData.electricityConsumption;
    const electricityEmissions =
      yearlyElectricityConsumption * (electricityFactor / 1000);

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
      const yearlyKm =
        vehicle.period === "monthly"
          ? vehicle.kilometers * 12
          : vehicle.kilometers;
      let emissionFactor = 0;

      if (vehicle.customEmissions && vehicle.customEmissions !== "") {
        emissionFactor = parseFloat(vehicle.customEmissions);
      } else {
        emissionFactor = getTransportEmissionFactor(
          vehicle.type,
          vehicle.fuelType
        );
      }

      return total + (yearlyKm * emissionFactor) / 1000;
    }, 0);

    let groceryEmissions = 0;
    if (formData.groceryMethod === "loyalty" && formData.groceryCO2) {
      const co2Value = parseFloat(formData.groceryCO2);
      groceryEmissions =
        formData.groceryPeriod === "monthly" ? co2Value * 12 : co2Value;
    } else if (formData.groceryMethod === "spending" && formData.grocerySpend) {
      const spending = parseFloat(formData.grocerySpend);
      const factor =
        formData.emissionFactor && formData.emissionFactor !== ""
          ? parseFloat(formData.emissionFactor)
          : getDietEmissionFactor(formData.dietType);
      const yearlySpending =
        formData.grocerySpendPeriod === "monthly" ? spending * 12 : spending;
      groceryEmissions = yearlySpending * factor;
    }

    const totalEmissions =
      heatingEmissions +
      electricityEmissions +
      wastewaterEmissions +
      transportEmissions +
      groceryEmissions;
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
        return Math.round(
          Math.max(1, 60 * (1 - (emissions - finnishAverage) / finnishAverage))
        );
      }
    };

    setResults({
      totalEmissions:
        formData.displayMode === "monthly"
          ? totalEmissions / 12
          : totalEmissions,
      heatingEmissions:
        formData.displayMode === "monthly"
          ? heatingEmissions / 12
          : heatingEmissions,
      electricityEmissions:
        formData.displayMode === "monthly"
          ? electricityEmissions / 12
          : electricityEmissions,
      wastewaterEmissions:
        formData.displayMode === "monthly"
          ? wastewaterEmissions / 12
          : wastewaterEmissions,
      transportEmissions:
        formData.displayMode === "monthly"
          ? transportEmissions / 12
          : transportEmissions,
      groceryEmissions:
        formData.displayMode === "monthly"
          ? groceryEmissions / 12
          : groceryEmissions,
      netZeroScore: calculateNetZeroScore(totalEmissions),
      emissionRating: getEmissionRating(perM2Emissions),
      perPersonEmissions,
      perM2Emissions,
    });
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

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

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
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

            <div className="bg-orange-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <ShoppingCart className="mr-2" size={20} />
                Grocery Emissions
              </h2>

              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3">
                  <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-white">
                    <input
                      type="radio"
                      name="groceryMethod"
                      value="loyalty"
                      checked={formData.groceryMethod === "loyalty"}
                      onChange={(e) =>
                        handleInputChange("groceryMethod", e.target.value)
                      }
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
                      onChange={(e) =>
                        handleInputChange("groceryMethod", e.target.value)
                      }
                      className="mr-3"
                    />
                    <div>
                      <div className="font-medium">Spending-Based</div>
                      <div className="text-xs text-gray-600">
                        Calculate from spending amount
                      </div>
                    </div>
                  </label>
                </div>

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
                          onChange={(e) =>
                            handleInputChange("groceryCO2", e.target.value)
                          }
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
                          onChange={(e) =>
                            handleInputChange("groceryPeriod", e.target.value)
                          }
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="monthly">Monthly</option>
                          <option value="annual">Annual</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

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
                          onChange={(e) =>
                            handleInputChange("grocerySpend", e.target.value)
                          }
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
                          onChange={(e) =>
                            handleInputChange(
                              "grocerySpendPeriod",
                              e.target.value
                            )
                          }
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
                            handleInputChange(
                              "emissionFactor",
                              getDietEmissionFactor(e.target.value)
                            );
                          }}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="meat-heavy">
                            Meat-heavy (1.4 kg CO₂/€)
                          </option>
                          <option value="balanced">
                            Balanced omnivore (0.85 kg CO₂/€)
                          </option>
                          <option value="vegetarian">
                            Mostly vegetarian (0.6 kg CO₂/€)
                          </option>
                          <option value="vegan">
                            Plant-based/vegan (0.4 kg CO₂/€)
                          </option>
                          <option value="national">
                            National average (0.7 kg CO₂/€)
                          </option>
                        </select>
                        <div className="text-xs text-gray-500 mt-1">
                          {formData.dietType === "meat-heavy" &&
                            "High red meat intake, processed foods; above national avg"}
                          {formData.dietType === "balanced" &&
                            "Typical Finnish diet: mix of meat, dairy, grains, vegetables"}
                          {formData.dietType === "vegetarian" &&
                            "Limited meat and dairy; more legumes, grains, vegetables"}
                          {formData.dietType === "vegan" &&
                            "No animal products; low-impact foods dominate"}
                          {formData.dietType === "national" &&
                            "Weighted average of typical consumer (per Luke & K-Ostokset)"}
                        </div>
                      </div>

                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Custom Factor (kg CO₂/€) - Optional
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={formData.emissionFactor}
                          onChange={(e) =>
                            handleInputChange("emissionFactor", e.target.value)
                          }
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                          placeholder={`Default for ${
                            formData.dietType
                          }: ${getDietEmissionFactor(
                            formData.dietType
                          )} kg CO₂/€`}
                        />
                        <div className="text-xs text-gray-500 mt-1">
                          Leave empty to use diet type default, or enter custom
                          value
                        </div>
                      </div>
                    </div>

                    {formData.grocerySpend && (
                      <div className="mt-3 p-2 bg-gray-50 rounded text-sm text-gray-600">
                        Annual estimate:{" "}
                        {(() => {
                          const spend = parseFloat(formData.grocerySpend) || 0;
                          const factor =
                            formData.emissionFactor &&
                            formData.emissionFactor !== ""
                              ? parseFloat(formData.emissionFactor)
                              : getDietEmissionFactor(formData.dietType);
                          const annualSpend =
                            formData.grocerySpendPeriod === "monthly"
                              ? spend * 12
                              : spend;
                          return (annualSpend * factor).toFixed(1);
                        })()}{" "}
                        kg CO₂/year
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

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
                  <strong>Groceries:</strong> From loyalty card data or spending
                  × emission factor.
                </p>
                <p>
                  <strong>Score:</strong> 100 = zero emissions, 60 = Finnish
                  average, 1 = very high.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default App;
