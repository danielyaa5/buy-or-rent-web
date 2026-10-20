export const STATE_CODES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
] as const

export type StateCode = (typeof STATE_CODES)[number]

export type StateDefaults = {
  name: string
  propertyTaxRate: number
  annualHomeInsurance: number
  annualRentersInsurance: number
}

export const STATE_DEFAULTS: Record<StateCode, StateDefaults> = {
  AL: { name: 'Alabama', propertyTaxRate: 0.38, annualHomeInsurance: 1748, annualRentersInsurance: 219 },
  AK: { name: 'Alaska', propertyTaxRate: 1.11, annualHomeInsurance: 1129, annualRentersInsurance: 186 },
  AZ: { name: 'Arizona', propertyTaxRate: 0.48, annualHomeInsurance: 1018, annualRentersInsurance: 163 },
  AR: { name: 'Arkansas', propertyTaxRate: 0.55, annualHomeInsurance: 1740, annualRentersInsurance: 205 },
  CA: { name: 'California', propertyTaxRate: 0.70, annualHomeInsurance: 1492, annualRentersInsurance: 169 },
  CO: { name: 'Colorado', propertyTaxRate: 0.48, annualHomeInsurance: 2079, annualRentersInsurance: 158 },
  CT: { name: 'Connecticut', propertyTaxRate: 1.81, annualHomeInsurance: 1814, annualRentersInsurance: 175 },
  DE: { name: 'Delaware', propertyTaxRate: 0.50, annualHomeInsurance: 1103, annualRentersInsurance: 147 },
  FL: { name: 'Florida', propertyTaxRate: 0.76, annualHomeInsurance: 2677, annualRentersInsurance: 181 },
  GA: { name: 'Georgia', propertyTaxRate: 0.77, annualHomeInsurance: 1655, annualRentersInsurance: 205 },
  HI: { name: 'Hawaii', propertyTaxRate: 0.27, annualHomeInsurance: 1431, annualRentersInsurance: 174 },
  ID: { name: 'Idaho', propertyTaxRate: 0.49, annualHomeInsurance: 1002, annualRentersInsurance: 147 },
  IL: { name: 'Illinois', propertyTaxRate: 2.01, annualHomeInsurance: 1343, annualRentersInsurance: 151 },
  IN: { name: 'Indiana', propertyTaxRate: 0.74, annualHomeInsurance: 1191, annualRentersInsurance: 168 },
  IA: { name: 'Iowa', propertyTaxRate: 1.39, annualHomeInsurance: 1268, annualRentersInsurance: 144 },
  KS: { name: 'Kansas', propertyTaxRate: 1.29, annualHomeInsurance: 1583, annualRentersInsurance: 159 },
  KY: { name: 'Kentucky', propertyTaxRate: 0.75, annualHomeInsurance: 1359, annualRentersInsurance: 159 },
  LA: { name: 'Louisiana', propertyTaxRate: 0.55, annualHomeInsurance: 2603, annualRentersInsurance: 243 },
  ME: { name: 'Maine', propertyTaxRate: 1.02, annualHomeInsurance: 1077, annualRentersInsurance: 145 },
  MD: { name: 'Maryland', propertyTaxRate: 0.97, annualHomeInsurance: 1392, annualRentersInsurance: 155 },
  MA: { name: 'Massachusetts', propertyTaxRate: 1.07, annualHomeInsurance: 1871, annualRentersInsurance: 173 },
  MI: { name: 'Michigan', propertyTaxRate: 1.25, annualHomeInsurance: 1056, annualRentersInsurance: 180 },
  MN: { name: 'Minnesota', propertyTaxRate: 1.02, annualHomeInsurance: 1774, annualRentersInsurance: 135 },
  MS: { name: 'Mississippi', propertyTaxRate: 0.72, annualHomeInsurance: 1907, annualRentersInsurance: 262 },
  MO: { name: 'Missouri', propertyTaxRate: 0.85, annualHomeInsurance: 1668, annualRentersInsurance: 173 },
  MT: { name: 'Montana', propertyTaxRate: 0.72, annualHomeInsurance: 1639, annualRentersInsurance: 156 },
  NE: { name: 'Nebraska', propertyTaxRate: 1.49, annualHomeInsurance: 1869, annualRentersInsurance: 144 },
  NV: { name: 'Nevada', propertyTaxRate: 0.47, annualHomeInsurance: 948, annualRentersInsurance: 174 },
  NH: { name: 'New Hampshire', propertyTaxRate: 1.66, annualHomeInsurance: 1188, annualRentersInsurance: 150 },
  NJ: { name: 'New Jersey', propertyTaxRate: 2.11, annualHomeInsurance: 1417, annualRentersInsurance: 151 },
  NM: { name: 'New Mexico', propertyTaxRate: 0.70, annualHomeInsurance: 1322, annualRentersInsurance: 177 },
  NY: { name: 'New York', propertyTaxRate: 1.55, annualHomeInsurance: 1628, annualRentersInsurance: 169 },
  NC: { name: 'North Carolina', propertyTaxRate: 0.66, annualHomeInsurance: 1621, annualRentersInsurance: 170 },
  ND: { name: 'North Dakota', propertyTaxRate: 0.99, annualHomeInsurance: 1325, annualRentersInsurance: 123 },
  OH: { name: 'Ohio', propertyTaxRate: 1.31, annualHomeInsurance: 995, annualRentersInsurance: 160 },
  OK: { name: 'Oklahoma', propertyTaxRate: 0.80, annualHomeInsurance: 2268, annualRentersInsurance: 216 },
  OR: { name: 'Oregon', propertyTaxRate: 0.81, annualHomeInsurance: 893, annualRentersInsurance: 155 },
  PA: { name: 'Pennsylvania', propertyTaxRate: 1.30, annualHomeInsurance: 1120, annualRentersInsurance: 151 },
  RI: { name: 'Rhode Island', propertyTaxRate: 1.21, annualHomeInsurance: 2074, annualRentersInsurance: 181 },
  SC: { name: 'South Carolina', propertyTaxRate: 0.48, annualHomeInsurance: 1571, annualRentersInsurance: 186 },
  SD: { name: 'South Dakota', propertyTaxRate: 1.06, annualHomeInsurance: 1756, annualRentersInsurance: 129 },
  TN: { name: 'Tennessee', propertyTaxRate: 0.50, annualHomeInsurance: 1492, annualRentersInsurance: 187 },
  TX: { name: 'Texas', propertyTaxRate: 1.49, annualHomeInsurance: 2397, annualRentersInsurance: 199 },
  UT: { name: 'Utah', propertyTaxRate: 0.52, annualHomeInsurance: 937, annualRentersInsurance: 145 },
  VT: { name: 'Vermont', propertyTaxRate: 1.59, annualHomeInsurance: 1109, annualRentersInsurance: 154 },
  VA: { name: 'Virginia', propertyTaxRate: 0.73, annualHomeInsurance: 1332, annualRentersInsurance: 152 },
  WA: { name: 'Washington', propertyTaxRate: 0.81, annualHomeInsurance: 1151, annualRentersInsurance: 162 },
  WV: { name: 'West Virginia', propertyTaxRate: 0.53, annualHomeInsurance: 1113, annualRentersInsurance: 173 },
  WI: { name: 'Wisconsin', propertyTaxRate: 1.42, annualHomeInsurance: 957, annualRentersInsurance: 141 },
  WY: { name: 'Wyoming', propertyTaxRate: 0.57, annualHomeInsurance: 1596, annualRentersInsurance: 142 },
}

export const isStateCode = (value: string): value is StateCode =>
  STATE_CODES.includes(value as StateCode)
