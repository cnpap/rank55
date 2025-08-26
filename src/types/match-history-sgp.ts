export interface SgpMatchHistoryResult {
  games: Game[];
  totalCount: number;
  startIndex: number;
  endIndex: number;
  serverId: string;
}

export interface MatchHistorySgp {
  games: Game[];
}

export interface Game {
  metadata: Metadata;
  json: Json;
}

export interface Metadata {
  product: string;
  tags: string[];
  participants: string[];
  timestamp: string;
  data_version: string;
  info_type: string;
  match_id: string;
  private: boolean;
}

export interface Json {
  endOfGameResult: string;
  gameCreation: number;
  gameDuration: number;
  gameEndTimestamp: number;
  gameId: number;
  gameMode: string;
  gameName: string;
  gameStartTimestamp: number;
  gameType: string;
  gameVersion: string;
  mapId: number;
  participants: Participant[];
  platformId: string;
  queueId: number;
  seasonId: number;
  teams: Team[];
  tournamentCode: string;
}

export interface Participant {
  PlayerScore0: number;
  PlayerScore1: number;
  PlayerScore10: number;
  PlayerScore11: number;
  PlayerScore2: number;
  PlayerScore3: number;
  PlayerScore4: number;
  PlayerScore5: number;
  PlayerScore6: number;
  PlayerScore7: number;
  PlayerScore8: number;
  PlayerScore9: number;
  allInPings: number;
  assistMePings: number;
  assists: number;
  baronKills: number;
  basicPings: number;
  challenges: Challenges;
  champExperience: number;
  champLevel: number;
  championId: number;
  championName: string;
  championTransform: number;
  commandPings: number;
  consumablesPurchased: number;
  damageDealtToBuildings: number;
  damageDealtToObjectives: number;
  damageDealtToTurrets: number;
  damageSelfMitigated: number;
  dangerPings: number;
  deaths: number;
  detectorWardsPlaced: number;
  doubleKills: number;
  dragonKills: number;
  eligibleForProgression: boolean;
  enemyMissingPings: number;
  enemyVisionPings: number;
  firstBloodAssist: boolean;
  firstBloodKill: boolean;
  firstTowerAssist: boolean;
  firstTowerKill: boolean;
  gameEndedInEarlySurrender: boolean;
  gameEndedInSurrender: boolean;
  getBackPings: number;
  goldEarned: number;
  goldSpent: number;
  holdPings: number;
  individualPosition: string;
  inhibitorKills: number;
  inhibitorTakedowns: number;
  inhibitorsLost: number;
  item0: number;
  item1: number;
  item2: number;
  item3: number;
  item4: number;
  item5: number;
  item6: number;
  itemsPurchased: number;
  killingSprees: number;
  kills: number;
  lane: string;
  largestCriticalStrike: number;
  largestKillingSpree: number;
  largestMultiKill: number;
  longestTimeSpentLiving: number;
  magicDamageDealt: number;
  magicDamageDealtToChampions: number;
  magicDamageTaken: number;
  missions: Missions;
  needVisionPings: number;
  neutralMinionsKilled: number;
  nexusKills: number;
  nexusLost: number;
  nexusTakedowns: number;
  objectivesStolen: number;
  objectivesStolenAssists: number;
  onMyWayPings: number;
  participantId: number;
  pentaKills: number;
  perks: Perks;
  physicalDamageDealt: number;
  physicalDamageDealtToChampions: number;
  physicalDamageTaken: number;
  placement: number;
  playerAugment1: number;
  playerAugment2: number;
  playerAugment3: number;
  playerAugment4: number;
  playerAugment5: number;
  playerAugment6: number;
  playerSubteamId: number;
  profileIcon: number;
  pushPings: number;
  puuid: string;
  quadraKills: number;
  retreatPings: number;
  riotIdGameName: string;
  riotIdTagline: string;
  role: string;
  sightWardsBoughtInGame: number;
  spell1Casts: number;
  spell1Id: number;
  spell2Casts: number;
  spell2Id: number;
  spell3Casts: number;
  spell4Casts: number;
  subteamPlacement: number;
  summoner1Casts: number;
  summoner2Casts: number;
  summonerId: number;
  summonerLevel: number;
  summonerName: string;
  teamEarlySurrendered: boolean;
  teamId: number;
  teamPosition: string;
  timeCCingOthers: number;
  timePlayed: number;
  totalAllyJungleMinionsKilled: number;
  totalDamageDealt: number;
  totalDamageDealtToChampions: number;
  totalDamageShieldedOnTeammates: number;
  totalDamageTaken: number;
  totalEnemyJungleMinionsKilled: number;
  totalHeal: number;
  totalHealsOnTeammates: number;
  totalMinionsKilled: number;
  totalTimeCCDealt: number;
  totalTimeSpentDead: number;
  totalUnitsHealed: number;
  tripleKills: number;
  trueDamageDealt: number;
  trueDamageDealtToChampions: number;
  trueDamageTaken: number;
  turretKills: number;
  turretTakedowns: number;
  turretsLost: number;
  unrealKills: number;
  visionClearedPings: number;
  visionScore: number;
  visionWardsBoughtInGame: number;
  wardsKilled: number;
  wardsPlaced: number;
  win: boolean;
}

export interface Challenges {
  '12AssistStreakCount': number;
  HealFromMapSources: number;
  InfernalScalePickup: number;
  SWARM_DefeatAatrox: number;
  SWARM_DefeatBriar: number;
  SWARM_DefeatMiniBosses: number;
  SWARM_EvolveWeapon: number;
  SWARM_Have3Passives: number;
  SWARM_KillEnemy: number;
  SWARM_PickupGold: number;
  SWARM_ReachLevel50: number;
  SWARM_Survive15Min: number;
  SWARM_WinWith5EvolvedWeapons: number;
  abilityUses: number;
  acesBefore15Minutes: number;
  alliedJungleMonsterKills: number;
  baronTakedowns: number;
  blastConeOppositeOpponentCount: number;
  bountyGold: number;
  buffsStolen: number;
  completeSupportQuestInTime: number;
  controlWardsPlaced: number;
  damagePerMinute: number;
  damageTakenOnTeamPercentage: number;
  dancedWithRiftHerald: number;
  deathsByEnemyChamps: number;
  dodgeSkillShotsSmallWindow: number;
  doubleAces: number;
  dragonTakedowns: number;
  earlyLaningPhaseGoldExpAdvantage: number;
  effectiveHealAndShielding: number;
  elderDragonKillsWithOpposingSoul: number;
  elderDragonMultikills: number;
  enemyChampionImmobilizations: number;
  enemyJungleMonsterKills: number;
  epicMonsterKillsNearEnemyJungler: number;
  epicMonsterKillsWithin30SecondsOfSpawn: number;
  epicMonsterSteals: number;
  epicMonsterStolenWithoutSmite: number;
  firstTurretKilled: number;
  firstTurretKilledTime?: number;
  fistBumpParticipation: number;
  flawlessAces: number;
  fullTeamTakedown: number;
  gameLength: number;
  getTakedownsInAllLanesEarlyJungleAsLaner?: number;
  goldPerMinute: number;
  hadOpenNexus: number;
  immobilizeAndKillWithAlly: number;
  initialBuffCount: number;
  initialCrabCount: number;
  jungleCsBefore10Minutes: number;
  junglerTakedownsNearDamagedEpicMonster: number;
  kTurretsDestroyedBeforePlatesFall: number;
  kda: number;
  killAfterHiddenWithAlly: number;
  killParticipation: number;
  killedChampTookFullTeamDamageSurvived: number;
  killingSprees: number;
  killsNearEnemyTurret: number;
  killsOnOtherLanesEarlyJungleAsLaner?: number;
  killsOnRecentlyHealedByAramPack: number;
  killsUnderOwnTurret: number;
  killsWithHelpFromEpicMonster: number;
  knockEnemyIntoTeamAndKill: number;
  landSkillShotsEarlyGame: number;
  laneMinionsFirst10Minutes: number;
  laningPhaseGoldExpAdvantage: number;
  legendaryCount: number;
  legendaryItemUsed: number[];
  lostAnInhibitor: number;
  maxCsAdvantageOnLaneOpponent: number;
  maxKillDeficit: number;
  maxLevelLeadLaneOpponent: number;
  mejaisFullStackInTime: number;
  moreEnemyJungleThanOpponent: number;
  multiKillOneSpell: number;
  multiTurretRiftHeraldCount: number;
  multikills: number;
  multikillsAfterAggressiveFlash: number;
  outerTurretExecutesBefore10Minutes: number;
  outnumberedKills: number;
  outnumberedNexusKill: number;
  perfectDragonSoulsTaken: number;
  perfectGame: number;
  pickKillWithAlly: number;
  playedChampSelectPosition: number;
  poroExplosions: number;
  quickCleanse: number;
  quickFirstTurret: number;
  quickSoloKills: number;
  riftHeraldTakedowns: number;
  saveAllyFromDeath: number;
  scuttleCrabKills: number;
  skillshotsDodged: number;
  skillshotsHit: number;
  snowballsHit: number;
  soloBaronKills: number;
  soloKills: number;
  soloTurretsLategame?: number;
  stealthWardsPlaced: number;
  survivedSingleDigitHpCount: number;
  survivedThreeImmobilizesInFight: number;
  takedownOnFirstTurret: number;
  takedowns: number;
  takedownsAfterGainingLevelAdvantage: number;
  takedownsBeforeJungleMinionSpawn: number;
  takedownsFirstXMinutes: number;
  takedownsInAlcove: number;
  takedownsInEnemyFountain: number;
  teamBaronKills: number;
  teamDamagePercentage: number;
  teamElderDragonKills: number;
  teamRiftHeraldKills: number;
  tookLargeDamageSurvived: number;
  turretPlatesTaken: number;
  turretTakedowns: number;
  turretsTakenWithRiftHerald: number;
  twentyMinionsIn3SecondsCount: number;
  twoWardsOneSweeperCount: number;
  unseenRecalls: number;
  visionScoreAdvantageLaneOpponent: number;
  visionScorePerMinute: number;
  voidMonsterKill: number;
  wardTakedowns: number;
  wardTakedownsBefore20M: number;
  wardsGuarded: number;
  baronBuffGoldAdvantageOverThreshold?: number;
  earliestBaron?: number;
  earliestDragonTakedown?: number;
  highestChampionDamage?: number;
  teleportTakedowns?: number;
  shortestTimeToAceFromFirstTakedown?: number;
  controlWardTimeCoverageInRiverOrEnemyHalf?: number;
  highestCrowdControlScore?: number;
  junglerKillsEarlyJungle?: number;
  killsOnLanersEarlyJungleAsJungler?: number;
  highestWardKills?: number;
  fastestLegendary?: number;
  fasterSupportQuestCompletion?: number;
}

export interface Missions {
  ActMission_S1_A2_ArenaRoundsWon: number;
  ActMission_S1_A2_BloodyPetalsCollected: number;
  ActMission_S1_A2_FeatsOfStrength: number;
  DemonsHand_MissionPointsA: number;
  DemonsHand_MissionPointsB: number;
  DemonsHand_MissionPointsC: number;
  DemonsHand_MissionPointsD: number;
  DemonsHand_MissionPointsE: number;
  DemonsHand_MissionPointsF: number;
  Event_2025LR_StructuresEpicMonsters: number;
  Event_ARAM_Docks: number;
  Event_ARAM_Hexgates: number;
  Event_Brawl_Jungle: number;
  Event_Brawl_Minions: number;
  Event_S1_A1_AprilFools_Dragon: number;
  Event_S1_A1_AprilFools_Snowball: number;
  Event_S1_A2_AprilFools_Dragon: number;
  Event_S1_A2_AprilFools_Garen_Play: number;
  Event_S1_A2_AprilFools_Garen_Takedown: number;
  Event_S1_A2_AprilFools_Snowball: number;
  Event_S1_A2_Arena_BraveryChampions: number;
  Event_S1_A2_Arena_NoxianChampions: number;
  Event_S1_A2_Arena_ReviveAllies: number;
  Event_S1_A2_Esports_TakedownEpicMonstersSingleGame: number;
  Event_S1_A2_Mordekaiser: number;
  Event_S2A2Champ_DamageAbilities: number;
  Event_S2A2Champ_DamageAutos: number;
  Event_S2A2_Exalted: number;
  Event_S2A2_MV: number;
  Event_S2A2_PetalPoints: number;
  HoL_ChampionsDamagedWhileHidden: number;
  HoL_ControlWardsKilled: number;
  HoL_Elite_AsheCrystalArrowTakedowns: number;
  HoL_Elite_AsheHawkshotChampsRevealed: number;
  HoL_Elite_EzrealEssenceFluxDetonated: number;
  HoL_Elite_EzrealTrueshotBarrageMultiHit: number;
  HoL_Elite_KaiSaAbilitiesUpgraded: number;
  HoL_Elite_KaiSaKillerInstinctKills: number;
  HoL_Elite_LucianCullingHits: number;
  HoL_Elite_LucianPiercingLightMultiHit: number;
  HoL_Elite_VayneCondemnStun: number;
  HoL_Elite_VayneTumbleDodge: number;
  HoL_EnemyTakedownUnderTower: number;
  HoL_FightsSurvivedWhileLowHealth: number;
  HoL_HiddenEnemiesDamaged: number;
  HoL_JungleCampsStolen: number;
  HoL_KillsWhileLowHealth: number;
  HoL_OutnumberedTakedowns: number;
  HoL_ShutdownGoldCollected: number;
  HoL_SoloKills: number;
  HoL_TurretsTakenWithinMinutes: number;
  Missions_CannonMinionsKilled: number;
  Missions_ChampionTakedownsWhileGhosted: number;
  Missions_ChampionTakedownsWithIgnite: number;
  Missions_ChampionsHitWithAbilitiesEarlyGame: number;
  Missions_ChampionsKilled: number;
  Missions_CreepScore: number;
  Missions_CreepScoreBy10Minutes: number;
  Missions_Crepe_DamageDealtSpeedZone: number;
  Missions_Crepe_SnowballLanded: number;
  Missions_Crepe_TakedownsWithInhibBuff: number;
  Missions_DamageToChampsWithItems: number;
  Missions_DamageToStructures: number;
  Missions_DestroyPlants: number;
  Missions_DominationRune: number;
  Missions_GoldFromStructuresDestroyed: number;
  Missions_GoldFromTurretPlatesTaken: number;
  Missions_GoldPerMinute: number;
  Missions_HealingFromLevelObjects: number;
  Missions_HexgatesUsed: number;
  Missions_ImmobilizeChampions: number;
  Missions_InspirationRune: number;
  Missions_LegendaryItems: number;
  Missions_MinionsKilled: number;
  Missions_PeriodicDamage: number;
  Missions_PlaceUsefulControlWards: number;
  Missions_PlaceUsefulWards: number;
  Missions_PorosFed: number;
  Missions_PrecisionRune: number;
  Missions_ResolveRune: number;
  Missions_SnowballsHit: number;
  Missions_SorceryRune: number;
  Missions_TakedownBaronsElderDragons: number;
  Missions_TakedownDragons: number;
  Missions_TakedownEpicMonsters: number;
  Missions_TakedownEpicMonstersSingleGame: number;
  Missions_TakedownGold: number;
  Missions_TakedownStructures: number;
  Missions_TakedownWards: number;
  Missions_TakedownsAfterExhausting: number;
  Missions_TakedownsAfterTeleporting: number;
  Missions_TakedownsBefore15Min: number;
  Missions_TakedownsUnderTurret: number;
  Missions_TakedownsWithHelpFromMonsters: number;
  Missions_TimeSpentActivelyPlaying: number;
  Missions_TotalGold: number;
  Missions_TrueDamageToStructures: number;
  Missions_TurretPlatesDestroyed: number;
  Missions_TwoChampsKilledWithSameAbility: number;
  Missions_VoidMitesSummoned: number;
  PlayerScore0: number;
  PlayerScore1: number;
  PlayerScore10: number;
  PlayerScore11: number;
  PlayerScore2: number;
  PlayerScore3: number;
  PlayerScore4: number;
  PlayerScore5: number;
  PlayerScore6: number;
  PlayerScore7: number;
  PlayerScore8: number;
  PlayerScore9: number;
  SeasonalMissions_TakedownAtakhan: number;
  WeeklyMission_S2_DamagingAbilities: number;
  WeeklyMission_S2_FeatsOfStrength: number;
  WeeklyMission_S2_SpiritPetals: number;
}

export interface Perks {
  statPerks: StatPerks;
  styles: Style[];
}

export interface StatPerks {
  defense: number;
  flex: number;
  offense: number;
}

export interface Style {
  description: string;
  selections: Selection[];
  style: number;
}

export interface Selection {
  perk: number;
  var1: number;
  var2: number;
  var3: number;
}

export interface Team {
  bans: Ban[];
  feats: Feats;
  objectives: Objectives;
  teamId: number;
  win: boolean;
}

export interface Ban {
  championId: number;
  pickTurn: number;
}

export interface Feats {
  EPIC_MONSTER_KILL: EpicMonsterKill;
  FIRST_BLOOD: FirstBlood;
  FIRST_TURRET: FirstTurret;
}

export interface EpicMonsterKill {
  featState: number;
}

export interface FirstBlood {
  featState: number;
}

export interface FirstTurret {
  featState: number;
}

export interface Objectives {
  atakhan: Atakhan;
  baron: Baron;
  champion: Champion;
  dragon: Dragon;
  horde: Horde;
  inhibitor: Inhibitor;
  riftHerald: RiftHerald;
  tower: Tower;
}

export interface Atakhan {
  first: boolean;
  kills: number;
}

export interface Baron {
  first: boolean;
  kills: number;
}

export interface Champion {
  first: boolean;
  kills: number;
}

export interface Dragon {
  first: boolean;
  kills: number;
}

export interface Horde {
  first: boolean;
  kills: number;
}

export interface Inhibitor {
  first: boolean;
  kills: number;
}

export interface RiftHerald {
  first: boolean;
  kills: number;
}

export interface Tower {
  first: boolean;
  kills: number;
}
