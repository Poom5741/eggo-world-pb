import { BrowserProvider, Contract } from 'ethers'

// EggNFT contract address (update from .env or config in production)
export const EGG_NFT_ADDRESS = process.env.NEXT_PUBLIC_EGG_NFT_ADDRESS || '0x0000000000000000000000000000000000000000'

// Minimal ABI for EggNFT functions (hatchEgg, upgradeEggRarity, getFoodCount, etc.)
export const EGG_NFT_ABI = [
  // Functions
  'function hatchEgg(uint256 eggId) external returns (uint256 animalId)',
  'function upgradeEggRarity(uint256 eggTokenId, uint256[] calldata foodIds) external',
  'function getEggProperties(uint256 tokenId) external view returns (uint256 egg_id, address owner, uint256 food_count, bool is_hatched, uint256 rarity_seed, address[4] referral_chain, uint256 animal_token_id, uint256 parent1_animal_id, uint256 parent2_animal_id, bool is_breeding_egg, uint256 rarity_upgrade_count, uint256 generation)',
  'function getFoodCount(uint256 tokenId) external view returns (uint256)',
  'function isEggHatched(uint256 tokenId) external view returns (bool)',
  
  // Events
  'event EggHatched(uint256 indexed egg_id, uint256 indexed animal_id, uint8 rarity, uint8 species)',
  'event EggUpgraded(uint256 indexed egg_id, uint256 new_food_count, uint256 rarity_bonus)',
] as const

// Rarity enum matching Solidity contract
export enum Rarity {
  Common = 0,
  Rare = 1,
  Epic = 2,
  Legendary = 3,
}

// Species enum matching Solidity contract
export enum Species {
  Chicken = 0,
  Quail = 1,
  Duck = 2,
  Peacock = 3,
  Swan = 4,
  Turkey = 5,
  Phoenix = 6,
  GoldenChicken = 7,
  SilverDuck = 8,
  Dragon = 9,
  Unicorn = 10,
  Gryphon = 11,
}

// Get signer from window.ethereum
export async function getSigner() {
  if (typeof window === 'undefined' || !(window as any).ethereum) {
    throw new Error('No Ethereum provider found. Please install MetaMask or another wallet.')
  }
  
  const provider = new BrowserProvider((window as any).ethereum)
  const signer = await provider.getSigner()
  return signer
}

// Get EggNFT contract instance
export function getEggNftContract(signer: any) {
  return new Contract(EGG_NFT_ADDRESS, EGG_NFT_ABI, signer)
}

// Parse EggHatched event from transaction receipt
export function parseEggHatchedEvent(receipt: any) {
  const event = receipt.logs?.find((log: any) => {
    try {
      return log.fragment?.name === 'EggHatched'
    } catch {
      return false
    }
  })
  
  if (!event) {
    throw new Error('EggHatched event not found in transaction receipt')
  }
  
  return {
    eggId: Number(event.args.egg_id),
    animalId: Number(event.args.animal_id),
    rarity: Number(event.args.rarity) as Rarity,
    species: Number(event.args.species) as Species,
  }
}

// Convert rarity number to string
export function getRarityName(rarity: Rarity): string {
  return Rarity[rarity]
}

// Convert species number to string
export function getSpeciesName(species: Species): string {
  return Species[species]
}

/**
 * ฟังก์ชันให้อาหารไข่เพื่อเพิ่มความหายาก
 * ต้องให้อาหารครบ 10 ชิ้นก่อน ถึงจะใช้ฟังก์ชันนี้ได้
 * @param signer - ผู้เซ็นธุรกรรม (เจ้าของไข่)
 * @param eggTokenId - Token ID ของไข่ NFT
 * @param foodIds - อาร์เรย์ของ Food NFT IDs ที่จะใช้ (ต้องมากกว่า 0)
 * @returns Transaction hash
 */
export async function upgradeEggRarity(
  signer: any,
  eggTokenId: number,
  foodIds: number[]
): Promise<string> {
  if (foodIds.length === 0) {
    throw new Error('Must provide at least 1 food item to upgrade')
  }
  
  const contract = getEggNftContract(signer)
  const tx = await contract.upgradeEggRarity(eggTokenId, foodIds)
  return tx.hash
}
