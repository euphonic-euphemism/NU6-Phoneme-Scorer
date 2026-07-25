        import { motion, AnimatePresence } from 'framer-motion';
import React, { useState, useMemo, useEffect, useRef } from 'react';
        import { IconBase, Calculator, Save, FolderOpen, Trash2, CheckCircle2, RotateCcw, UserCheck, UserPlus, Check, X, BarChart3, ListChecks, WholeWord, AlertCircle, AlertOctagon, HelpCircle, Download, TrendingUp, Search, Loader, Database, FileUp, HistoryIcon, Activity, Lock, Flame, SettingsIcon, FileText, FileJson, Moon, Sun, Clock, Play, Pause, Square, ArrowRightLeft, Edit } from './components/icons/index.jsx';
        import { LIST_1A, LIST_2A, LIST_3A, LIST_4A, LIST_HF1, LIST_HF2, LIST_HF3, LIST_HF4 } from './data/wordLists.js';
        import { WORD_TABLES, PHONEME_TABLES, loadCriticalDifferenceTables, loadPhonemeTables, getListData, calculateStats, getTheta, getCriticalLimits, getInterpolatedCriticalLimits, generateData } from './utils/scoring.js';
        import { LoginModal } from './components/modals/LoginModal.jsx';
import { PhonemeFrequencyModal } from "./components/modals/PhonemeFrequencyModal.jsx";
import { BKBSINScoringPanel } from "./components/modals/BKBSINScoringPanel.jsx";
import { CriticalDifferenceModal } from "./components/modals/CriticalDifferenceModal.jsx";
import { ListeningEffortScaleModal } from "./components/modals/ListeningEffortScaleModal.jsx";
import { PhonemeDisclaimerModal } from "./components/modals/PhonemeDisclaimerModal.jsx";
import { LoadTestModal } from "./components/modals/LoadTestModal.jsx";
import { ImportPreviewModal } from "./components/modals/ImportPreviewModal.jsx";
import { HistoryChart } from "./components/modals/HistoryChart.jsx";
import { SettingsModal } from "./components/modals/SettingsModal.jsx";
import { ComparativeEaseScaleModal } from "./components/modals/ComparativeEaseScaleModal.jsx";
import { RecoveryModal } from "./components/modals/RecoveryModal.jsx";

        

        // --- INLINE ICONS ---


        // ... [PHONEME_MAP, PHONEME_GROUPS, LISTS 1A-4A are the same] ...
        const PHONEME_MAP = { "f": "Fricative", "v": "Fricative", "θ": "Fricative", "ð": "Fricative", "s": "Fricative", "z": "Fricative", "ʃ": "Fricative", "ʒ": "Fricative", "h": "Fricative", "tʃ": "Affricate", "dʒ": "Affricate", "p": "Stop", "b": "Stop", "t": "Stop", "d": "Stop", "k": "Stop", "g": "Stop", "m": "Nasal", "n": "Nasal", "ŋ": "Nasal", "l": "Liquid/Glide", "r": "Liquid/Glide", "w": "Liquid/Glide", "j": "Liquid/Glide", "i": "Vowel", "ɪ": "Vowel", "eɪ": "Vowel", "ɛ": "Vowel", "æ": "Vowel", "u": "Vowel", "ʊ": "Vowel", "oʊ": "Vowel", "ɔ": "Vowel", "ɑ": "Vowel", "ʌ": "Vowel", "ɝ": "Vowel", "aɪ": "Vowel", "ɔɪ": "Vowel", "aʊ": "Vowel", "ə": "Vowel", "ɚ": "Vowel" };
        const PHONEME_GROUPS = { "High Frequency (Fricatives, Affricates, Stops)": ["Fricative", "Affricate", "Stop"], "Low Frequency (Nasals, Liquids, Glides, Vowels)": ["Nasal", "Liquid/Glide", "Vowel"] };


        // BKB-SIN List Pairs (Disc 2 - Split Track I)
        // BKB-SIN List Pairs (Disc 2 - Split Track I)
        // Verified Track Mapping: Track 03.wav = List Pair 1
        const BKB_SIN_LISTS = {
            1: {
                id: 1,
                track: "03",
                listA: [
                    { i: 1, s: "They are looking at the clock", k: [2, 4, 5, 6], snr: 21 },
                    { i: 2, s: "The car engine is running", k: [1, 2, 4], snr: 18 },
                    { i: 3, s: "Children like strawberries", k: [0, 2], snr: 15 }, // Wait, key words count?
                    // Manual p.4 says: "The first sentence in each list has four key words, and the remaining sentences each have three."
                    // List 1A words (underlined in manual, inferred from common nouns/verbs if not visible):
                    // 1. They are *looking* at the *clock*. (Wait, 4 key words?)
                    // Let's re-read manual scoring rule: "The first sentence... has four key words... remaining... three."
                    // P.4 OCR: "1. They are looking at the clock. 4" (Count is 4)
                    // "2. The car engine is running. 3"
                    // "3. Children like strawberries. 3"
                    // I will infer key words based on content.
                    // 1. *They* *looking* *clock*? Or *looking* *at* *clock*?
                    // Usually it's content words. "They", "looking", "clock". That's 3.
                    // Manual says 4. Maybe "They", "are", "looking", "clock"?
                    // Actually, let's look at Figure 1 (P.3 OCR) for underlining example.
                    // "The cat is sitting on the bed" -> "cat", "sitting", "bed". (3?) No, count says 4.
                    // "The cat is sitting on the bed." -> maybe "cat", "sitting", "on", "bed"?
                    // Let's use standard BKB keywords if possible, or reasonable guess.
                    // For implementation, I will make all words clickable but only counting "key" ones is hard if I don't know them.
                    // I will mark likely key words.
                    // 1A.1: They, looking, clock. (3). Maybe "are"?
                    // Let's use the indices I can best guess.
                    // 1. *They* are *looking* at the *clock*. (3) - Manual says 4. 
                    // Let's assume: They, looking, at, clock? 
                    // I'll update the UI to allow "Select # Correct" (0-3 or 0-4) instead of clicking words, to avoid ambiguity.
                    // This is safer and matches the score sheet style.
                ],
                listB: [] // Placeholder, will fill below
            }
        };

        // Redefining complete structure with simple sentence strings, as UI will handle score input (0-3/4)
        const BKB_SIN_LISTS_FULL = {
            1: {
                id: 1,
                track: "03",
                listA: [
                    { i: 1, s: "*They* are *looking* at the *clock*", kwCount: 4, snr: 21 },
                    { i: 2, s: "The *car* *engine* is *running*", kwCount: 3, snr: 18 },
                    { i: 3, s: "*Children* *like* *strawberries*", kwCount: 3, snr: 15 },
                    { i: 4, s: "*They* are *buying* some *bread*", kwCount: 3, snr: 12 },
                    { i: 5, s: "The *green* *tomatoes* are *small*", kwCount: 3, snr: 9 },
                    { i: 6, s: "*He* *played* with his *train*", kwCount: 3, snr: 6 },
                    { i: 7, s: "The *bag* *fell* to the *ground*", kwCount: 3, snr: 3 },
                    { i: 8, s: "The *boy* *did* a *handstand*", kwCount: 3, snr: 0 },
                    { i: 9, s: "The *water* *boiled* *quickly*", kwCount: 3, snr: -3 },
                    { i: 10, s: "The *man* is *painting* a *sign*", kwCount: 3, snr: -6 }
                ],
                listB: [
                    { i: 1, s: "The *dog* *made* an *angry* *noise*", kwCount: 4, snr: 21 },
                    { i: 2, s: "*They* *followed* the *path*", kwCount: 3, snr: 18 },
                    { i: 3, s: "*Someone* is *crossing* the *road*", kwCount: 3, snr: 15 },
                    { i: 4, s: "The *mailman* *brought* a *letter*", kwCount: 3, snr: 12 },
                    { i: 5, s: "The *milk* was by the *front* *door*", kwCount: 3, snr: 9 },
                    { i: 6, s: "The *candy* *shop* was *empty*", kwCount: 3, snr: 6 },
                    { i: 7, s: "The *lady* *stayed* for *lunch*", kwCount: 3, snr: 3 },
                    { i: 8, s: "The *policeman* *knows* the *way*", kwCount: 3, snr: 0 },
                    { i: 9, s: "The *little* *girl* was *happy*", kwCount: 3, snr: -3 },
                    { i: 10, s: "*They* are *coming* for *Christmas*", kwCount: 3, snr: -6 }
                ]
            },
            2: {
                id: 2,
                track: "04", // Assuming track increments
                listA: [
                    { i: 1, s: "The *cat* is *sitting* on the *bed*", kwCount: 4, snr: 21 },
                    { i: 2, s: "*They* had a *lovely* *day*", kwCount: 3, snr: 18 },
                    { i: 3, s: "The *thin* *dog* was *hungry*", kwCount: 3, snr: 15 },
                    { i: 4, s: "*They* are *watching* the *train*", kwCount: 3, snr: 12 },
                    { i: 5, s: "The *dog* *played* with a *stick*", kwCount: 3, snr: 9 },
                    { i: 6, s: "The *farmer* *keeps* a *bull*", kwCount: 3, snr: 6 },
                    { i: 7, s: "The *lady* *wore* a *coat*", kwCount: 3, snr: 3 },
                    { i: 8, s: "The *boy* is *running* *away*", kwCount: 3, snr: 0 },
                    { i: 9, s: "The *room* is *getting* *cold*", kwCount: 3, snr: -3 },
                    { i: 10, s: "The *wife* *helped* her *husband*", kwCount: 3, snr: -6 }
                ],
                listB: [
                    { i: 1, s: "The *lady* *went* to the *store*", kwCount: 4, snr: 21 },
                    { i: 2, s: "A *tree* *fell* on the *house*", kwCount: 3, snr: 18 },
                    { i: 3, s: "The *fruit* *came* in a *box*", kwCount: 3, snr: 15 },
                    { i: 4, s: "The *husband* *brought* some *flowers*", kwCount: 3, snr: 12 },
                    { i: 5, s: "A *man* *told* the *police*", kwCount: 3, snr: 9 },
                    { i: 6, s: "*Potatoes* *grow* in the *ground*", kwCount: 3, snr: 6 },
                    { i: 7, s: "The *big* *dog* was *dangerous*", kwCount: 3, snr: 3 },
                    { i: 8, s: "The *strawberry* *jam* was *sweet*", kwCount: 3, snr: 0 },
                    { i: 9, s: "The *boy* has *black* *hair/tie*", kwCount: 3, snr: -3 },
                    { i: 10, s: "The *mother* *heard* the *baby*", kwCount: 3, snr: -6 }
                ]
            },
            3: {
                id: 3,
                track: "05",
                listA: [
                    { i: 1, s: "The *ball* *went* *into* the *goal*", kwCount: 4, snr: 21 },
                    { i: 2, s: "The *house* had a *nice* *garden*", kwCount: 3, snr: 18 },
                    { i: 3, s: "*He* *found* his *brother*", kwCount: 3, snr: 15 },
                    { i: 4, s: "Some *animals* *sleep* on *straw*", kwCount: 3, snr: 12 },
                    { i: 5, s: "The *jelly* *jar* was *full*", kwCount: 3, snr: 9 },
                    { i: 6, s: "*They* are *kneeling* *down*", kwCount: 3, snr: 6 },
                    { i: 7, s: "The *cook* is *making* a *cake*", kwCount: 3, snr: 3 },
                    { i: 8, s: "The *child* *grabbed* the *toy*", kwCount: 3, snr: 0 },
                    { i: 9, s: "A *boy* *fell* from the *window*", kwCount: 3, snr: -3 },
                    { i: 10, s: "*She* *used* her *spoon*", kwCount: 3, snr: -6 }
                ],
                listB: [
                    { i: 1, s: "*Mother* *cut* the *birthday* *cake*", kwCount: 4, snr: 21 },
                    { i: 2, s: "The *mailman* *comes* *early*", kwCount: 3, snr: 18 },
                    { i: 3, s: "The *sign* *showed* the *way*", kwCount: 3, snr: 15 },
                    { i: 4, s: "The *grass* is *getting* *long*", kwCount: 3, snr: 12 },
                    { i: 5, s: "A *man* is *turning* the *faucet*", kwCount: 3, snr: 9 },
                    { i: 6, s: "The *fire* was *very* *hot*", kwCount: 3, snr: 6 },
                    { i: 7, s: "*He* is *sucking* his *thumb*", kwCount: 3, snr: 3 },
                    { i: 8, s: "The *driver* *started* the *engine*", kwCount: 3, snr: 0 },
                    { i: 9, s: "The *janitor* *swept* the *floor*", kwCount: 3, snr: -3 },
                    { i: 10, s: "A *grocer* *sells* *butter*", kwCount: 3, snr: -6 }
                ]
            },
            4: {
                id: 4,
                track: "06",
                listA: [
                    { i: 1, s: "A *mouse* *ran* *down* the *hole*", kwCount: 4, snr: 21 },
                    { i: 2, s: "The *light* *went* *out*", kwCount: 3, snr: 18 },
                    { i: 3, s: "*They* *wanted* some *potatoes*", kwCount: 3, snr: 15 },
                    { i: 4, s: "The *little* *girl* is *shouting*", kwCount: 3, snr: 12 },
                    { i: 5, s: "The *cold* *milk* is in a *pitcher*", kwCount: 3, snr: 9 },
                    { i: 6, s: "The *paint* *dripped* on the *ground*", kwCount: 3, snr: 6 },
                    { i: 7, s: "*Mother* *stirred* her *tea*", kwCount: 3, snr: 3 },
                    { i: 8, s: "The *father* is *coming* *home*", kwCount: 3, snr: 0 },
                    { i: 9, s: "*They* *painted* the *wall*", kwCount: 3, snr: -3 },
                    { i: 10, s: "The *towel* *dropped* on the *floor*", kwCount: 3, snr: -6 }
                ],
                listB: [
                    { i: 1, s: "The *boy* *got* *into* *bed*", kwCount: 4, snr: 21 },
                    { i: 2, s: "*He* is *reaching* for his *spoon*", kwCount: 3, snr: 18 },
                    { i: 3, s: "*They* are *staying* for *supper*", kwCount: 3, snr: 15 },
                    { i: 4, s: "The *girl* *held* a *mirror*", kwCount: 3, snr: 12 },
                    { i: 5, s: "The *cows* are in the *pasture*", kwCount: 3, snr: 9 },
                    { i: 6, s: "*He* *paid* his *bill*", kwCount: 3, snr: 6 },
                    { i: 7, s: "*Mother* *made* some *curtains*", kwCount: 3, snr: 3 },
                    { i: 8, s: "The *oven* is *too* *hot*", kwCount: 3, snr: 0 },
                    { i: 9, s: "The *two* *children* are *laughing*", kwCount: 3, snr: -3 },
                    { i: 10, s: "The *pepper* *shaker* was *empty*", kwCount: 3, snr: -6 }
                ]
            },
            5: {
                id: 5,
                track: "07",
                listA: [
                    { i: 1, s: "*They* *ate* the *lemon* *pie*", kwCount: 4, snr: 21 },
                    { i: 2, s: "A *sharp* *knife* is *dangerous*", kwCount: 3, snr: 18 },
                    { i: 3, s: "The *smart* *girls* are *reading*", kwCount: 3, snr: 15 },
                    { i: 4, s: "The *broom* *stood* in the *corner*", kwCount: 3, snr: 12 },
                    { i: 5, s: "The *woman* *cleaned* her *house*", kwCount: 3, snr: 9 },
                    { i: 6, s: "*Mother* *got* a *saucepan*", kwCount: 3, snr: 6 },
                    { i: 7, s: "The *young* *people* are *dancing*", kwCount: 3, snr: 3 },
                    { i: 8, s: "The *bus* *left* *early*", kwCount: 3, snr: 0 },
                    { i: 9, s: "The *ball* is *bouncing* *very* *high*", kwCount: 3, snr: -3 },
                    { i: 10, s: "*Father* *forgot* the *bread*", kwCount: 3, snr: -6 }
                ],
                listB: [
                    { i: 1, s: "*They* *had* two *empty* *bottles*", kwCount: 4, snr: 21 },
                    { i: 2, s: "*He* *closed* his *eyes*", kwCount: 3, snr: 18 },
                    { i: 3, s: "The *lady* *bought* some *butter*", kwCount: 3, snr: 15 },
                    { i: 4, s: "*They* *called* an *ambulance*", kwCount: 3, snr: 12 },
                    { i: 5, s: "The *policeman* *found* a *dog*", kwCount: 3, snr: 9 },
                    { i: 6, s: "The *driver* *lost* his *way*", kwCount: 3, snr: 6 },
                    { i: 7, s: "*They* *stared* at the *picture*", kwCount: 3, snr: 3 },
                    { i: 8, s: "The *cat* *drank* from a *saucer*", kwCount: 3, snr: 0 },
                    { i: 9, s: "The *oven* *door* was *open*", kwCount: 3, snr: -3 },
                    { i: 10, s: "The *silly* *boy* is *hiding*", kwCount: 3, snr: -6 }
                ]
            },
            6: {
                id: 6,
                track: "08",
                listA: [
                    { i: 1, s: "A *boy* *ran* *down* the *path*", kwCount: 4, snr: 21 },
                    { i: 2, s: "The *orange* was *very* *sweet*", kwCount: 3, snr: 18 },
                    { i: 3, s: "*He* is *holding* his *nose*", kwCount: 3, snr: 15 },
                    { i: 4, s: "The *new* *road* is on the *map*", kwCount: 3, snr: 12 },
                    { i: 5, s: "The *boy* *forgot* his *book*", kwCount: 3, snr: 9 },
                    { i: 6, s: "A *friend* *came* for *lunch*", kwCount: 3, snr: 6 },
                    { i: 7, s: "The *match* *boxes* are *empty*", kwCount: 3, snr: 3 },
                    { i: 8, s: "The *family* *bought* a *house*", kwCount: 3, snr: 0 },
                    { i: 9, s: "The *ball* *broke* the *window*", kwCount: 3, snr: -3 },
                    { i: 10, s: "The *pond* *water* is *dirty*", kwCount: 3, snr: -6 }
                ],
                listB: [
                    { i: 1, s: "*They* are *running* *past* the *house*", kwCount: 4, snr: 21 },
                    { i: 2, s: "The *police* are *clearing* the *road*", kwCount: 3, snr: 18 },
                    { i: 3, s: "*She* *writes* to her *brother*", kwCount: 3, snr: 15 },
                    { i: 4, s: "The *book* *tells* a *story*", kwCount: 3, snr: 12 },
                    { i: 5, s: "*They* are *climbing* the *tree*", kwCount: 3, snr: 9 },
                    { i: 6, s: "*She* *stood* near her *window*", kwCount: 3, snr: 6 },
                    { i: 7, s: "The *baby* *broke* his *cup*", kwCount: 3, snr: 3 },
                    { i: 8, s: "The *dinner* *plate* is *hot*", kwCount: 3, snr: 0 },
                    { i: 9, s: "A *dish* *towel* is by the *sink*", kwCount: 3, snr: -3 },
                    { i: 10, s: "The *good* *boy* is *helping*", kwCount: 3, snr: -6 }
                ]
            },
            7: {
                id: 7,
                track: "09",
                listA: [
                    { i: 1, s: "*Men* *wear* *long* *pants*", kwCount: 4, snr: 21 },
                    { i: 2, s: "The *two* *farmers* are *talking*", kwCount: 3, snr: 18 },
                    { i: 3, s: "*Father* *wrote* a *letter*", kwCount: 3, snr: 15 },
                    { i: 4, s: "The *food* *cost* a *lot*", kwCount: 3, snr: 12 },
                    { i: 5, s: "The *girl* is *washing* her *hair*", kwCount: 3, snr: 9 },
                    { i: 6, s: "*He* *lost* his *hat*", kwCount: 3, snr: 6 },
                    { i: 7, s: "The *faucets* are *above* the *sink*", kwCount: 3, snr: 3 },
                    { i: 8, s: "*They* *had* some *cold* *meat*", kwCount: 3, snr: 0 },
                    { i: 9, s: "The *children* *helped* the *milkman*", kwCount: 3, snr: -3 },
                    { i: 10, s: "The *rice* *pudding* was *ready*", kwCount: 3, snr: -6 }
                ],
                listB: [
                    { i: 1, s: "The *boy* *slipped* on the *stairs*", kwCount: 4, snr: 21 },
                    { i: 2, s: "The *snow* is on the *roof*", kwCount: 3, snr: 18 },
                    { i: 3, s: "*Sugar* is *very* *sweet*", kwCount: 3, snr: 15 },
                    { i: 4, s: "The *washing* *machine* *broke*", kwCount: 3, snr: 12 },
                    { i: 5, s: "*They* are *clearing* the *table*", kwCount: 3, snr: 9 },
                    { i: 6, s: "*She* *hurt* her *hand*", kwCount: 3, snr: 6 },
                    { i: 7, s: "The *cup* is on a *saucer*", kwCount: 3, snr: 3 },
                    { i: 8, s: "The *boy* *got* into *trouble*", kwCount: 3, snr: 0 },
                    { i: 9, s: "The *truck* *carried* *fruit*", kwCount: 3, snr: -3 },
                    { i: 10, s: "The *ice* *cream* was *pink*", kwCount: 3, snr: -6 }
                ]
            },
            8: {
                id: 8,
                track: "10",
                listA: [
                    { i: 1, s: "*They* *washed* in *cold* *water*", kwCount: 4, snr: 21 },
                    { i: 2, s: "The *dog* *sleeps* in a *basket*", kwCount: 3, snr: 18 },
                    { i: 3, s: "An *old* *woman* was at *home*", kwCount: 3, snr: 15 },
                    { i: 4, s: "The *girl* *played* with the *baby*", kwCount: 3, snr: 12 },
                    { i: 5, s: "The *children* *washed* the *plates*", kwCount: 3, snr: 9 },
                    { i: 6, s: "The *match* *fell* on the *floor*", kwCount: 3, snr: 6 },
                    { i: 7, s: "The *shop* *closed* for *lunch*", kwCount: 3, snr: 3 },
                    { i: 8, s: "The *boy* *hurried* to *school*", kwCount: 3, snr: 0 },
                    { i: 9, s: "*Flowers* *grow* in the *garden*", kwCount: 3, snr: -3 },
                    { i: 10, s: "The *children* *waved* at the *train*", kwCount: 3, snr: -6 }
                ],
                listB: [
                    { i: 1, s: "*They* *broke* *all* the *eggs*", kwCount: 4, snr: 21 },
                    { i: 2, s: "The *car* *hit* a *wall*", kwCount: 3, snr: 18 },
                    { i: 3, s: "*They* are *riding* their *bicycles*", kwCount: 3, snr: 15 },
                    { i: 4, s: "*He* *broke* his *leg*", kwCount: 3, snr: 12 },
                    { i: 5, s: "The *shirts* are *hanging* in the *closet*", kwCount: 3, snr: 9 },
                    { i: 6, s: "The *ground* was *very* *hard*", kwCount: 3, snr: 6 },
                    { i: 7, s: "The *buckets* *hold* *water*", kwCount: 3, snr: 3 },
                    { i: 8, s: "The *chicken* *laid* some *eggs*", kwCount: 3, snr: 0 },
                    { i: 9, s: "*She* *had* her *spending* *money*", kwCount: 3, snr: -3 },
                    { i: 10, s: "*He* is *bringing* his *raincoat*", kwCount: 3, snr: -6 }
                ]
            },
            9: {
                id: 9,
                track: "11",
                listA: [
                    { i: 1, s: "The *football* *player* *lost* a *shoe*", kwCount: 4, snr: 21 },
                    { i: 2, s: "The *painter* *used* a *brush*", kwCount: 3, snr: 18 },
                    { i: 3, s: "The *lady* *sat* on her *chair*", kwCount: 3, snr: 15 },
                    { i: 4, s: "The *milkman* *brought* the *cream*", kwCount: 3, snr: 12 },
                    { i: 5, s: "The *dog* *chased* the *cat*", kwCount: 3, snr: 9 },
                    { i: 6, s: "*Mother* *shut* the *window*", kwCount: 3, snr: 6 },
                    { i: 7, s: "The *apple* *pie* was *good*", kwCount: 3, snr: 3 },
                    { i: 8, s: "*Rain* *falls* from the *clouds*", kwCount: 3, snr: 0 }
                ],
                listB: [
                    { i: 1, s: "*They* *carried* some *shopping* *bags*", kwCount: 4, snr: 21 },
                    { i: 2, s: "*They* *laughed* at his *story*", kwCount: 3, snr: 18 },
                    { i: 3, s: "The *small* *boy* was *asleep*", kwCount: 3, snr: 15 },
                    { i: 4, s: "The *sun* *melted* the *snow*", kwCount: 3, snr: 12 },
                    { i: 5, s: "The *truck* *drove* up the *road*", kwCount: 3, snr: 9 },
                    { i: 6, s: "The *children* *dropped* the *bag*", kwCount: 3, snr: 6 },
                    { i: 7, s: "The *dog* *came* *back*", kwCount: 3, snr: 3 },
                    { i: 8, s: "*She* *found* her *purse*", kwCount: 3, snr: 0 }
                ]
            },
            10: {
                id: 10,
                track: "12",
                listA: [
                    { i: 1, s: "*She* *looked* in her *mirror*", kwCount: 4, snr: 21 },
                    { i: 2, s: "The *dog* is *eating* some *meat*", kwCount: 3, snr: 18 },
                    { i: 3, s: "A *boy* *broke* the *fence*", kwCount: 3, snr: 15 },
                    { i: 4, s: "The *yellow* *pears* *tasted* *good*", kwCount: 3, snr: 12 },
                    { i: 5, s: "The *lady* *washed* the *shirt*", kwCount: 3, snr: 9 },
                    { i: 6, s: "The *cup* is *hanging* on a *hook*", kwCount: 3, snr: 6 },
                    { i: 7, s: "The *family* *likes* *fish*", kwCount: 3, snr: 3 },
                    { i: 8, s: "The *baby* is on the *rug*", kwCount: 3, snr: 0 }
                ],
                listB: [
                    { i: 1, s: "*They* *waited* for *one* *hour*", kwCount: 4, snr: 21 },
                    { i: 2, s: "The *fruit* is on the *ground*", kwCount: 3, snr: 18 },
                    { i: 3, s: "The *girl* *has* a *picture* *book*", kwCount: 3, snr: 15 },
                    { i: 4, s: "The *jug* is on the *shelf*", kwCount: 3, snr: 12 },
                    { i: 5, s: "*They* are *shopping* for *cheese*", kwCount: 3, snr: 9 },
                    { i: 6, s: "The *bus* *stopped* *suddenly*", kwCount: 3, snr: 6 },
                    { i: 7, s: "The *three* *girls* are *listening*", kwCount: 3, snr: 3 },
                    { i: 8, s: "The *coat* is on a *chair*", kwCount: 3, snr: 0 }
                ]
            }
        };

        const BKB_SIN_NORMS = {
            adults: { mean: -2.5, sd: 0.8 },
            children: {
                age5_6: { mean: 3.5, sd: 2.0 },
                age7_10: { mean: 0.8, sd: 1.2 },
                age11_14: { mean: -0.9, sd: 1.1 }
            }
        };

        // Critical Differences for Comparison (1 List Pair)
        const BKB_CRITICAL_DIFFERENCES = {
            adults: { 95: 2.2, 80: 1.8 },
            // Adult CI Users would be { 95: 4.4, 80: 3.6 } - utilizing Adult Normal for default
            children: {
                age5_6: { 95: 5.4, 80: 4.4 },
                age7_10: { 95: 3.5, 80: 2.9 },
                age11_14: { 95: 3.2, 80: 2.6 }
            }
        };


const SIMULATED_DB = (() => {
            const records = [];
            const firstNames = ['Alex', 'Chris', 'Sam', 'Taylor', 'Jordan', 'Morgan', 'Casey', 'Jamie', 'Riley', 'Avery', 'Dakota', 'Peyton', 'Quinn', 'Cameron', 'Robin', 'Skyler', 'Reese', 'Rowan', 'Elliot', 'Blake'];
            const lastNames = ['Johnson', 'Smith', 'Brown', 'Lee', 'Garcia', 'Martinez', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor', 'Anderson', 'Thomas', 'Jackson', 'White', 'Harris', 'Martin', 'Thompson', 'Young', 'King'];
            let seed = 123456;
            const rand = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
            const randInt = (min, max) => Math.floor(rand() * (max - min + 1)) + min;
            const lists = ['1A', '2A', '3A', '4A'];
            const NUM_RECORDS = 100;
            const PATIENTS = 20; // approximate number of unique patients for longitudinal data

            // Track last date per patient so repeated records are clustered (more longitudinal)
            const patientLastDaysAgo = new Array(PATIENTS).fill(null);
            const patientBaselinePercent = new Array(PATIENTS).fill(null); // baseline word % per patient (phoneme ~20% lower)
            const patientPrevModeA = new Array(PATIENTS).fill(null);
            const patientPrevModeB = new Array(PATIENTS).fill(null);

            for (let i = 0; i < NUM_RECORDS; i++) {
                // Bias patient selection so some patients have more longitudinal records
                let patientIndex;
                if (rand() < 0.7) {
                    // more repeats in a smaller subgroup
                    const subgroup = Math.max(3, Math.floor(PATIENTS / 3));
                    patientIndex = randInt(0, subgroup - 1);
                } else {
                    patientIndex = randInt(0, PATIENTS - 1);
                }

                const patientName = `${firstNames[patientIndex % firstNames.length]} ${lastNames[patientIndex % lastNames.length]}`;
                const cNumber = `SIM-${String(patientIndex + 1).padStart(3, '0')}`;

                // Cluster dates for the same patient so longitudinal records are near each other
                let daysAgo;
                if (patientLastDaysAgo[patientIndex] === null) {
                    daysAgo = randInt(0, 365);
                } else {
                    daysAgo = Math.max(0, Math.min(365, patientLastDaysAgo[patientIndex] + randInt(-30, 30)));
                }
                patientLastDaysAgo[patientIndex] = daysAgo;
                const testDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

                // Establish or reuse a patient baseline to keep longitudinal results orderly
                if (patientBaselinePercent[patientIndex] === null) {
                    // Baselines concentrated in a mid-range (less variance overall)
                    patientBaselinePercent[patientIndex] = randInt(45, 75);
                } else {
                    // small drift over time to avoid cyclic extremes
                    patientBaselinePercent[patientIndex] = Math.max(10, Math.min(95, patientBaselinePercent[patientIndex] + randInt(-2, 2)));
                }
                const baseline = patientBaselinePercent[patientIndex];

                // Randomize scoringMode per test but bias to keep mode same across longitudinal tests
                let scoringModeA = (patientPrevModeA[patientIndex] && rand() < 0.7) ? patientPrevModeA[patientIndex] : (rand() < 0.5 ? 'phoneme' : 'word');
                let scoringModeB = (patientPrevModeB[patientIndex] && rand() < 0.7) ? patientPrevModeB[patientIndex] : (rand() < 0.5 ? 'phoneme' : 'word');

                // Enforce phoneme parity: if either test is phoneme-scored, make both phoneme-scored
                if (scoringModeA === 'phoneme' || scoringModeB === 'phoneme') {
                    scoringModeA = scoringModeB = 'phoneme';
                }

                patientPrevModeA[patientIndex] = scoringModeA;
                patientPrevModeB[patientIndex] = scoringModeB;

                const listA = lists[randInt(0, lists.length - 1)];
                const listB = lists[randInt(0, lists.length - 1)];

                // Enforce condition constraints:
                // Test A must be one of ['Unaided', 'Current Tech']
                // Test B must be one of ['Current Tech', 'New Tech']
                const condAOptions = ['Unaided', 'Current Tech'];
                const condBOptions = ['Current Tech', 'New Tech'];
                let condA = condAOptions[randInt(0, condAOptions.length - 1)];
                let condB = condBOptions[randInt(0, condBOptions.length - 1)];
                // Avoid both being 'Current Tech' — prefer making Test B 'New Tech' if conflict
                if (condA === condB) {
                    condB = 'New Tech';
                }

                // Shared level and noise (SNR) between A and B
                const level = `${randInt(50, 80)} dB`;
                const SNR_OPTIONS = [5, 10, 15];
                const snrValue = `${SNR_OPTIONS[randInt(0, SNR_OPTIONS.length - 1)]} dB SNR`;

                // Lightweight in-generator stats calcuator (word% / phoneme%) so we can enforce relationships
                const computeStatsLocal = (listId, section, scores, limitTo10 = false) => {
                    const allWords = listId === '1A' ? LIST_1A : listId === '2A' ? LIST_2A : listId === '3A' ? LIST_3A : LIST_4A;
                    let visibleWords = allWords;
                    if (section === 'first') visibleWords = allWords.slice(0, 25);
                    else if (section === 'first_10') visibleWords = allWords.slice(0, 10);
                    else if (section === 'second') visibleWords = allWords.slice(25, 50);
                    else if (section === 'second_10') visibleWords = allWords.slice(25, 35);
                    else if (section === 'full') visibleWords = allWords;
                    if (limitTo10) visibleWords = visibleWords.slice(0, 10);
                    let totalPhonemes = 0; let correctPhonemes = 0; let correctWords = 0; let totalWords = visibleWords.length;
                    visibleWords.forEach(word => {
                        let wordCorrectCount = 0; let wordPhonemeCount = 0;
                        word.p.forEach((phoneme, pIndex) => {
                            if (phoneme === '-') return;
                            wordPhonemeCount++; totalPhonemes++;
                            const key = `${listId}_${word.i}_${pIndex}`;
                            if (scores[key]) { correctPhonemes++; wordCorrectCount++; }
                        });
                        if (wordCorrectCount === wordPhonemeCount && wordPhonemeCount > 0) { correctWords++; }
                    });
                    return {
                        totalPhonemes, correctPhonemes, phonemePercent: totalPhonemes === 0 ? 0 : Math.round((correctPhonemes / totalPhonemes) * 100),
                        correctWords, totalWords, wordPercent: totalWords === 0 ? 0 : Math.round((correctWords / totalWords) * 100)
                    };
                };

                // Helper to generate realistic score maps used by calculateStats()
                // Accept a percentBase representing the approximate WORD % for the test (phoneme will be ~20% lower)
                const genScoresFor = (listId, section, scoringMode, limitTo10, percentBase) => {
                    const allWords = listId === '1A' ? LIST_1A : listId === '2A' ? LIST_2A : listId === '3A' ? LIST_3A : LIST_4A;
                    let visibleWords = allWords;
                    if (section === 'first') visibleWords = allWords.slice(0, 25);
                    else if (section === 'first_10') visibleWords = allWords.slice(0, 10);
                    else if (section === 'second') visibleWords = allWords.slice(25, 50);
                    else if (section === 'second_10') visibleWords = allWords.slice(25, 35);
                    else if (section === 'full') visibleWords = allWords;
                    if (limitTo10) visibleWords = visibleWords.slice(0, 10);

                    const scores = {};

                    if (scoringMode === 'word') {
                        // Use provided percentBase with small perturbation for per-test noise
                        let percent = percentBase + randInt(-3, 3);
                        percent = Math.max(0, Math.min(100, percent));
                        const correctWords = Math.round(visibleWords.length * (percent / 100));
                        const chosen = new Set();
                        while (chosen.size < correctWords && chosen.size < visibleWords.length) {
                            chosen.add(randInt(0, visibleWords.length - 1));
                        }
                        chosen.forEach(idx => {
                            const w = visibleWords[idx];
                            w.p.forEach((ph, pIdx) => { if (ph !== '-') scores[`${listId}_${w.i}_${pIdx}`] = true; });
                        });
                    } else {
                        // Phoneme scoring: roughly 20% lower than word base with small perturbation
                        const phonemeKeys = [];
                        visibleWords.forEach(w => w.p.forEach((ph, pIdx) => { if (ph !== '-') phonemeKeys.push(`${listId}_${w.i}_${pIdx}`); }));
                        if (phonemeKeys.length > 0) {
                            let percent = (percentBase - 20) + randInt(-3, 3);
                            percent = Math.max(0, Math.min(100, percent));
                            const correctCount = Math.round(phonemeKeys.length * (percent / 100));
                            const chosen = new Set();
                            while (chosen.size < correctCount && chosen.size < phonemeKeys.length) {
                                chosen.add(phonemeKeys[randInt(0, phonemeKeys.length - 1)]);
                            }
                            chosen.forEach(k => scores[k] = true);
                        }
                    }

                    // Ensure there is at least one scored item
                    if (Object.keys(scores).length === 0) {
                        // Force one phoneme correct
                        const fallbackWord = visibleWords[0];
                        if (fallbackWord && fallbackWord.p) {
                            for (let pIdx = 0; pIdx < fallbackWord.p.length; pIdx++) {
                                if (fallbackWord.p[pIdx] !== '-') { scores[`${listId}_${fallbackWord.i}_${pIdx}`] = true; break; }
                            }
                        }
                    }

                    return scores;
                };

                const limitA = rand() < 0.25;
                const limitB = rand() < 0.25;

                // Create condition-aware percent baselines so New Tech >= Current Tech >= Unaided (usually)
                const unaidedBase = Math.max(0, Math.min(100, baseline + randInt(-5, 5)));
                const currentBase = Math.max(0, Math.min(100, unaidedBase + randInt(0, 7)));
                const newBase = Math.max(0, Math.min(100, Math.max(currentBase, unaidedBase) + randInt(0, 7)));

                const percentBaseA = condA === 'Unaided' ? unaidedBase : (condA === 'Current Tech' ? currentBase : newBase);
                const percentBaseB = condB === 'Unaided' ? unaidedBase : (condB === 'Current Tech' ? currentBase : newBase);

                // Slight per-test generation then validate and adjust if needed
                let scoresA = genScoresFor(listA, 'second_10', scoringModeA, limitA, percentBaseA);
                let scoresB = genScoresFor(listB, 'second_10', scoringModeB, limitB, percentBaseB);

                // Compute quick stats to validate ordering constraints
                let statsA = computeStatsLocal(listA, 'second_10', scoresA, limitA);
                let statsB = computeStatsLocal(listB, 'second_10', scoresB, limitB);

                // Enforce that Current Tech / New Tech are almost always better than Unaided
                // Small chance of exception to keep data realistic
                const TECH_EXCEPTION_CHANCE = 0.05;
                const ensureTechBetterThanUnaided = (techListId, techScores, techStats, techLimit, techScoringMode, techPercentBase, unaidedStats) => {
                    if (rand() < TECH_EXCEPTION_CHANCE) return { techStats, techScores };
                    let attempts = 0;
                    while (techStats.wordPercent + 2 < unaidedStats.wordPercent && attempts < 6) {
                        attempts++;
                        const boost = 2 + randInt(0, 6);
                        const boostedBase = Math.min(100, Math.max(techPercentBase, unaidedStats.wordPercent + boost));
                        techScores = genScoresFor(techListId, 'second_10', techScoringMode, techLimit, boostedBase);
                        techStats = computeStatsLocal(techListId, 'second_10', techScores, techLimit);
                    }
                    return { techStats, techScores };
                };

                if (condA === 'Unaided' && (condB === 'Current Tech' || condB === 'New Tech')) {
                    const r = ensureTechBetterThanUnaided(listB, scoresB, statsB, limitB, scoringModeB, percentBaseB, statsA);
                    statsB = r.techStats; scoresB = r.techScores;
                } else if (condB === 'Unaided' && (condA === 'Current Tech' || condA === 'New Tech')) {
                    const r = ensureTechBetterThanUnaided(listA, scoresA, statsA, limitA, scoringModeA, percentBaseA, statsB);
                    statsA = r.techStats; scoresA = r.techScores;
                }

                // If New Tech should generally be equal or better than other conditions, enforce it
                if (condB === 'New Tech') {
                    // If B is much worse (word% at least 10 points lower), try regenerating B a few times with boosted base
                    let attempts = 0;
                    while (statsB.wordPercent + 10 < statsA.wordPercent && attempts < 6) {
                        attempts++;
                        // bump the base so New Tech improves relative to A
                        const boost = Math.max(5, Math.round((statsA.wordPercent - statsB.wordPercent) / 2));
                        const newBase = Math.min(100, Math.max(percentBaseB, percentBaseA + boost + randInt(0, 4)));
                        scoresB = genScoresFor(listB, 'second_10', scoringModeB, limitB, newBase);
                        statsB = computeStatsLocal(listB, 'second_10', scoresB, limitB);
                    }
                }

                // If scoring modes cause extreme inversion (phoneme>word or huge swings), make small adjustments
                if (statsA.wordPercent < statsA.phonemePercent) {
                    // try to nudge A by regenerating with slightly higher base
                    const newBaseA = Math.min(100, percentBaseA + 5);
                    scoresA = genScoresFor(listA, 'second_10', scoringModeA, limitA, newBaseA);
                    statsA = computeStatsLocal(listA, 'second_10', scoresA, limitA);
                }
                if (statsB.wordPercent < statsB.phonemePercent) {
                    const newBaseB = Math.min(100, percentBaseB + 5);
                    scoresB = genScoresFor(listB, 'second_10', scoringModeB, limitB, newBaseB);
                    statsB = computeStatsLocal(listB, 'second_10', scoresB, limitB);
                }

                // Ensure phoneme presence mirrored between Test A and Test B
                const hasPhonemeA = Object.keys(scoresA).length > 0;
                const hasPhonemeB = Object.keys(scoresB).length > 0;
                if (hasPhonemeA && !hasPhonemeB) {
                    // regenerate B as phoneme-scored so both have phoneme-level entries
                    scoresB = genScoresFor(listB, 'second_10', 'phoneme', limitB, percentBaseB);
                    statsB = computeStatsLocal(listB, 'second_10', scoresB, limitB);
                } else if (hasPhonemeB && !hasPhonemeA) {
                    scoresA = genScoresFor(listA, 'second_10', 'phoneme', limitA, percentBaseA);
                    statsA = computeStatsLocal(listA, 'second_10', scoresA, limitA);
                }

                // Set comparativeEase based on observed word performance (scaled and clamped 0-10)
                let comparativeEase = Math.round((statsB.wordPercent - statsA.wordPercent) / 10) + 5;
                if (comparativeEase < 0) comparativeEase = 0; if (comparativeEase > 10) comparativeEase = 10;

                // Generate outcome data
                const outcomeOptions = ['Sold', 'Not Sold', 'Need to Follow Up'];
                const outcome = outcomeOptions[randInt(0, outcomeOptions.length - 1)];

                const soldTypeOptions = ['Private Pay', 'Managed Care', 'Vocational Rehabilitation Services'];
                const soldType = outcome === 'Sold' ? soldTypeOptions[randInt(0, soldTypeOptions.length - 1)] : 'Private Pay';

                const notSoldReasonOptions = ['Price', 'Current Hearing Aids Too New', 'Patient Considers Themselves Too Old', 'Question of Value', 'No Benefit', 'Other'];
                const notSoldReason = outcome === 'Not Sold' ? notSoldReasonOptions[randInt(0, notSoldReasonOptions.length - 1)] : 'Price';

                // Generate random timer duration (5-15 minutes in milliseconds)
                const timerElapsed = randInt(300000, 900000); // 5-15 minutes

                // Generate stimulus presentation
                const stimulusPresentation = rand() < 0.7 ? 'MLV' : 'Recording';

                // Generate TNT values (some records have them, some don't)
                const hasTNT = rand() < 0.6; // 60% of records have TNT data
                const tntA = hasTNT ? `${randInt(3, 8)} dB` : '';
                const tntExcursionA = hasTNT ? `${randInt(1, 4)} dB` : '';
                const tntB = hasTNT ? `${randInt(3, 8)} dB` : '';
                const tntExcursionB = hasTNT ? `${randInt(1, 4)} dB` : '';

                records.push({
                    id: `sim-${String(i + 1).padStart(3, '0')}`,
                    patientName,
                    cNumber,
                    testDate,
                    notes: `Simulated record ${i + 1} for ${patientName}`,
                    activeTestId: rand() < 0.5 ? 'A' : 'B',
                    activeTab: rand() < 0.5 ? 'comparison' : 'scoring',
                    confidenceLevel: rand() < 0.5 ? 95 : 80,
                    outcome: outcome,
                    soldType: soldType,
                    notSoldReason: notSoldReason,
                    timerElapsed: timerElapsed,
                    tests: {
                        A: { id: 'A', listId: listA, section: 'second_10', scoringMode: scoringModeA, condition: condA, deviceModel: rand() < 0.3 ? `Model-${randInt(1, 5)}` : '', level: level, snr: snrValue, stimulusPresentation: stimulusPresentation, tnt: tntA, scores: scoresA, limitTo10: limitA, askedContinue: false },
                        B: { id: 'B', listId: listB, section: 'second_10', scoringMode: scoringModeB, condition: condB, deviceModel: rand() < 0.3 ? `Model-${randInt(1, 5)}` : '', level: level, snr: snrValue, stimulusPresentation: stimulusPresentation, tnt: tntB, scores: scoresB, limitTo10: limitB, askedContinue: false },
                        comparativeEase: comparativeEase
                    }
                });
            }
            return records;
        })();
        // Load critical difference tables from CSV
// --- COMPONENTS ---


const computeAgeYears = (dob, testDate) => {
    if (!dob || !testDate) return '';
    const birthDate = new Date(dob);
    const dateOfTest = new Date(testDate);
    if (isNaN(birthDate) || isNaN(dateOfTest)) return '';
    let age = dateOfTest.getFullYear() - birthDate.getFullYear();
    const m = dateOfTest.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && dateOfTest.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
};

const App = () => {
            // ... (State setup) ...
            const [firstName, setFirstName] = useState('');
            const [lastName, setLastName] = useState('');
            const patientName = `${firstName.trim()}${lastName.trim() ? ' ' + lastName.trim() : ''}`.trim();
            const [cNumber, setCNumber] = useState('');
            const [dateOfBirth, setDateOfBirth] = useState('');
            const [testDate, setTestDate] = useState(new Date().toISOString().split('T')[0]);
            const [activeTab, setActiveTab] = useState('scoring');
            const [activeTestId, setActiveTestId] = useState('A');
            const [confidenceLevel, setConfidenceLevel] = useState(80);
            const [clearConfirm, setClearConfirm] = useState(false);
            const [showScaleModal, setShowScaleModal] = useState(false);
            const [showChartModal, setShowChartModal] = useState(false);
            const [showPhonemeModal, setShowPhonemeModal] = useState(false);
            const [showLoadModal, setShowLoadModal] = useState(false);
            const [currentTestId, setCurrentTestId] = useState(null);
            const [showComparativeScaleModal, setShowComparativeScaleModal] = useState(false);
            const [clinicalNotes, setClinicalNotes] = useState('');
            const [calibrationMode, setCalibrationMode] = useState('none'); // 'none', 'left', 'right'
            const [calibrationSignalGroup, setCalibrationSignalGroup] = useState('rh_hf'); // 'nu6', 'rh_hf', 'bkb'
            const [calibrationSignal, setCalibrationSignal] = useState('rh_hf_tone'); // the specific signal
            const calibrationAudioRef = useRef(null);
            const [isPlayingNoise, setIsPlayingNoise] = useState(false);
            const [snrLevel, setSnrLevel] = useState(10); // Default 10 dB SNR
            const noiseAudioRef = useRef(null);

            // Comparison Mode State
            const [reversedComparison, setReversedComparison] = useState(false);

            // Audio Routing State
            const [channelSwap, setChannelSwap] = useState(true); // true: Speech=R, Noise=L (default)
            const [speechToBoth, setSpeechToBoth] = useState(false); // Play speech to both L and R
            const audioContextRef = useRef(null);

            // New Audio State
            const currentAudioRef = useRef(null);
            const [audioState, setAudioState] = useState('stopped'); // 'playing', 'paused', 'stopped'

            const getAudioContext = () => {
                if (!audioContextRef.current) {
                    const AudioContext = window.AudioContext || window.webkitAudioContext;
                    audioContextRef.current = new AudioContext();
                    console.log("Created AudioContext. State:", audioContextRef.current.state);
                }
                if (audioContextRef.current.state === 'suspended') {
                    console.log("AudioContext suspended, attempting resume...");
                    audioContextRef.current.resume().then(() => {
                        console.log("AudioContext resumed. State:", audioContextRef.current.state);
                    });
                }
                return audioContextRef.current;
            };

            const playSoundWithPan = (audioElement, panValue) => {
                try {
                    const ctx = getAudioContext();
                    // Fix: Check if element already has a source node (though difficult to check directly, we can wrap in error handler)
                    // Note: ensure we don't create multiple sources for same element if cached? 
                    // But we create new Audio() every time in playAudio, so it's fine.
                    const source = ctx.createMediaElementSource(audioElement);
                    const panner = ctx.createStereoPanner();
                    panner.pan.value = panValue;
                    source.connect(panner).connect(ctx.destination);
                    console.log(`Connected Web Audio: pan=${panValue}, ctxState=${ctx.state}`);
                } catch (e) {
                    console.error("Web Audio API Error:", e);
                }
            };

            // New State for Settings
            const [showSettingsModal, setShowSettingsModal] = useState(false);
            const [clinicSettings, setClinicSettings] = useState(null);

            // Auth/Encryption State
            const [isLocked, setIsLocked] = useState(true);
            const [hasPassword, setHasPassword] = useState(false);
            const [dbReady, setDbReady] = useState(false);
            const [dbError, setDbError] = useState(null);

            // --- AUTH INIT & SETTINGS LOAD ---
            useEffect(() => {
                const init = async () => {
                    try {
                        const isSetup = await window.SecureDB.isSetup();
                        setHasPassword(isSetup);
                        setDbReady(true);
                    } catch (e) {
                        console.error("DB Init Error:", e);
                        setDbError(e.message || "Failed to load secure storage");
                    }
                };
                init();
            }, []);

            // Load settings after unlock
            useEffect(() => {
                if (!isLocked) {
                    window.SecureDB.getSettings().then(s => setClinicSettings(s));
                }
            }, [isLocked]);

            const fileInputRef = useRef(null);
            const saveHandlerRef = useRef(null);
            const [importModePick, setImportModePick] = useState('append');
            const [showImportPreviewModal, setShowImportPreviewModal] = useState(false);
            const [importPreviewRecords, setImportPreviewRecords] = useState([]);
            const [importPreviewFileName, setImportPreviewFileName] = useState('');
            const [importPreviewInvalidCount, setImportPreviewInvalidCount] = useState(0);
            const [showImportSourceModal, setShowImportSourceModal] = useState(false);

            const [showDeleteDbModal, setShowDeleteDbModal] = useState(false);
            const [deleteDbConfirmText, setDeleteDbConfirmText] = useState('');
            const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
            const [showRecoveryModal, setShowRecoveryModal] = useState(false);
            const [recoveryData, setRecoveryData] = useState(null);
            const [lastSaved, setLastSaved] = useState(null);
            const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
            const [showExportModal, setShowExportModal] = useState(false);
            const [showFileMenu, setShowFileMenu] = useState(false);
            const [exportStartDate, setExportStartDate] = useState('');
            const [exportEndDate, setExportEndDate] = useState('');
            const [showEncryptedImportModal, setShowEncryptedImportModal] = useState(false);
            const [encryptedImportPassword, setEncryptedImportPassword] = useState('');
            const [showExportPasswordModal, setShowExportPasswordModal] = useState(false);
            const [showNewTestModal, setShowNewTestModal] = useState(false);
            const [exportPassword, setExportPassword] = useState('');
            const [encryptedImportFile, setEncryptedImportFile] = useState(null);

            const [tests, setTests] = useState({
                A: { id: 'A', listId: 'HF1', section: 'full', scoringMode: 'phoneme', condition: 'Unaided', deviceModel: '', level: '', snr: '', tnt: '', tntExcursionWidth: '', stimulusPresentation: 'Recording', scores: {}, limitTo10: false, askedContinue: false },
                B: { id: 'B', listId: 'HF2', section: 'full', scoringMode: 'phoneme', condition: 'New Tech', deviceModel: '', level: '', snr: '', tntExcursionWidth: '', tnt: '', stimulusPresentation: 'Recording', scores: {}, limitTo10: false, askedContinue: false },
                comparativeEase: 5
            });

            // Timer state
            const [timerStartTime, setTimerStartTime] = useState(null);
            const [timerElapsed, setTimerElapsed] = useState(0);
            const [timerPausedAt, setTimerPausedAt] = useState(null);
            const [timerIsRunning, setTimerIsRunning] = useState(false);
            const [timerDisplay, setTimerDisplay] = useState('00:00');

            // Outcome state
            const [outcome, setOutcome] = useState('Sold');
            const [notSoldReason, setNotSoldReason] = useState('Price');
            const [soldType, setSoldType] = useState('Private Pay');
            const [outcomeMode, setOutcomeMode] = useState('Demo'); // 'Demo' or 'Validation'
            const [ioiHaScore, setIoiHaScore] = useState('');

            // ... (Helper memos: activeTest, statsA, statsB, limits ...) ...
            const activeTest = tests[activeTestId];

            // Ensure HF lists use 'full' section (fix for initial load issue)
            const normalizeTestForStats = (test) => {
                if ((test.listId === 'HF1' || test.listId === 'HF2') && test.section !== 'full') {
                    return { ...test, section: 'full' };
                }
                return test;
            };

            const statsA = useMemo(() => {
                const normalizedTest = normalizeTestForStats(tests.A);
                return calculateStats(normalizedTest.listId, normalizedTest.section, normalizedTest.scores, normalizedTest.limitTo10);
            }, [tests.A.listId, tests.A.section, tests.A.scores, tests.A.limitTo10]);

            const statsB = useMemo(() => {
                const normalizedTest = normalizeTestForStats(tests.B);
                return calculateStats(normalizedTest.listId, normalizedTest.section, normalizedTest.scores, normalizedTest.limitTo10);
            }, [tests.B.listId, tests.B.section, tests.B.scores, tests.B.limitTo10]);

            const activeStats = activeTestId === 'A' ? statsA : statsB;
            const ageYears = useMemo(() => computeAgeYears(dateOfBirth, testDate), [dateOfBirth, testDate]);

            // Comparison Logic (Always A vs B)
            const baselineStats = statsA;
            const comparisonStats = statsB;
            const baselineTest = tests.A;
            const comparisonTest = tests.B;

            const wordCriticalLimits = useMemo(() => { if (baselineStats.totalWords === 0) return { lower: 0, upper: 100 }; return getCriticalLimits(baselineStats.wordPercent, baselineStats.totalWords, confidenceLevel); }, [baselineStats.wordPercent, baselineStats.totalWords, confidenceLevel]);
            const phonemeCriticalLimits = useMemo(() => {
                if (baselineStats.totalPhonemes === 0) return { lower: 0, upper: 100 };
                // CRITICAL FIX: Use unrounded percentage for table lookup
                const rawPercent = (baselineStats.correctPhonemes / baselineStats.totalPhonemes) * 100;
                return getCriticalLimits(rawPercent, baselineStats.totalPhonemes, confidenceLevel, true);
            }, [baselineStats.correctPhonemes, baselineStats.totalPhonemes, confidenceLevel]);
            const isWordDiffSig = comparisonStats.wordPercent < wordCriticalLimits.lower || comparisonStats.wordPercent > wordCriticalLimits.upper;
            const isPhonemeDiffSig = comparisonStats.phonemePercent < phonemeCriticalLimits.lower || comparisonStats.phonemePercent > phonemeCriticalLimits.upper;

            // TNT Significance: Parse aTNT values and check if difference > 2.8 dB
            const parseTNT = (tntString) => {
                if (!tntString) return null;
                const match = tntString.match(/([+-]?\d+\.?\d*)/);
                return match ? parseFloat(match[1]) : null;
            };
            const tntA = parseTNT(tests.A.tnt);
            const tntB = parseTNT(tests.B.tnt);
            const tntDifference = (tntA !== null && tntB !== null) ? Math.abs(tntB - tntA) : null;
            const tntCriticalValue = confidenceLevel === 95 ? 2.8 : 1.8;
            const isTNTDiffSig = tntDifference !== null && tntDifference > tntCriticalValue;

            // TNT Excursion Width Significance: Check if difference > 1 dB (95%) or > 0.7 dB (80%)
            const tntExcursionWidthA = parseTNT(tests.A.tntExcursionWidth);
            const tntExcursionWidthB = parseTNT(tests.B.tntExcursionWidth);
            const tntExcursionWidthDifference = (tntExcursionWidthA !== null && tntExcursionWidthB !== null) ? Math.abs(tntExcursionWidthB - tntExcursionWidthA) : null;
            const tntExcursionWidthCriticalValue = confidenceLevel === 95 ? 1.0 : 0.7;
            const isTNTExcursionWidthDiffSig = tntExcursionWidthDifference !== null && tntExcursionWidthDifference > tntExcursionWidthCriticalValue;

            // BKB-SIN Significance Logic
            const getBKBCriticalDifference = (age, confLevel) => 0;

            const bkbCriticalDiff = getBKBCriticalDifference(ageYears, confidenceLevel);
            const bkbDifference = (statsA.isBKB && statsB.isBKB) ? Math.abs(statsA.snr50 - statsB.snr50) : null;
            const isBKBDiffSig = bkbDifference !== null && bkbDifference > bkbCriticalDiff;

            const getSectionOptions = (testId) => {
                const test = tests[testId];
                if (test.listId && test.listId.startsWith('BKB')) {
                    return [{ val: 'full', label: 'Full Pair', n: 20 }];
                }
                // HF1 and HF2 lists only support full (1-25)
                // HF1, HF2, HF3, HF4 lists only support full (1-25)
                if (['HF1', 'HF2', 'HF3', 'HF4'].includes(test.listId)) {
                    return [{ val: 'full', label: 'Full List (1-25)', n: 25 }];
                }
                const options = [{ val: 'first_10', label: '1st Half (First 10)', n: 10 }, { val: 'first', label: '1st Half (1-25)', n: 25 }, { val: 'second_10', label: '2nd Half (First 10)', n: 10 }, { val: 'second', label: '2nd Half (26-50)', n: 25 }, { val: 'full', label: 'Full List (1-50)', n: 50 }];
                if (testId === 'A') return options;
                const aSection = tests.A.section;
                const aIsTen = aSection.includes('_10');
                const aIsHalf = aSection === 'first' || aSection === 'second';
                const aIsFull = aSection === 'full';
                return options.filter(opt => { if (aIsTen) return opt.n === 10; if (aIsHalf) return opt.n === 25; if (aIsFull) return opt.n === 50; return true; });
            };

            // ... (Update/Toggle handlers) ...
            const updateActiveTest = (field, value) => {
                if (field === 'scoringMode' && value === 'phoneme') setShowPhonemeModal(true);
                setHasUnsavedChanges(true);
                setTests(prev => {
                    // Stop noise if changing list (except initially setting it)
                    if (field === 'listId' && isPlayingNoise) {
                        if (noiseAudioRef.current) {
                            noiseAudioRef.current.pause();
                            noiseAudioRef.current.currentTime = 0;
                        }
                        setIsPlayingNoise(false);
                    }

                    const newTests = { ...prev, [activeTestId]: { ...prev[activeTestId], [field]: value } };

                    // If changing to HF1 or HF2 list, force section to 'full'
                    // If changing to HF lists, force section to 'full'
                    if (field === 'listId' && ['HF1', 'HF2', 'HF3', 'HF4'].includes(value)) {
                        newTests[activeTestId].section = 'full';
                    }

                    // Special Default for NU-6 List 3A: If A selects 3A, default A=First Half, B=3A Second Half
                    if (activeTestId === 'A' && field === 'listId' && value === '3A') {
                        newTests.A.section = 'first';
                        newTests.B = { ...newTests.B, listId: '3A', section: 'second' };
                    }

                    // BKB-SIN Auto-Pairing Logic (Odd <-> Even)
                    if (activeTestId === 'A' && field === 'listId' && value.startsWith('BKB')) {
                        const pairId = parseInt(value.replace('BKB', ''));
                        // Pair 1 with 2, 3 with 4, etc.
                        const partnerId = (pairId % 2 !== 0) ? pairId + 1 : pairId - 1;
                        if (partnerId > 0) {
                            newTests.B.listId = `BKB${partnerId}`;
                            newTests.B.section = 'full';
                        }
                    }

                    if (activeTestId === 'A' && field === 'section') {
                        const isTen = value.includes('_10');
                        const isHalf = value === 'first' || value === 'second';
                        const isFull = value === 'full';
                        let bSection = newTests.B.section;
                        if (isTen) { if (!bSection.includes('_10')) bSection = 'first_10'; }
                        else if (isHalf) { if (bSection !== 'first' && bSection !== 'second') bSection = 'first'; }
                        else if (isFull) { bSection = 'full'; }
                        newTests.B.section = bSection;
                    }
                    if (field === 'scoringMode') {
                        newTests.A.scoringMode = value;
                        newTests.B.scoringMode = value;
                    }
                    if (activeTestId === 'A' && (field === 'level' || field === 'snr' || field === 'stimulusPresentation')) {
                        newTests.B[field] = value;
                    }
                    return newTests;
                });
            };
            const updateComparativeEase = (value) => { setHasUnsavedChanges(true); setTests(prev => ({ ...prev, comparativeEase: value })); };

            // Timer functions
            const startTimer = () => {
                if (!timerIsRunning) {
                    const now = Date.now();
                    if (timerPausedAt !== null) {
                        // Resuming from pause
                        setTimerStartTime(now - timerElapsed);
                        setTimerPausedAt(null);
                    } else {
                        // Starting fresh
                        setTimerStartTime(now);
                        setTimerElapsed(0);
                    }
                    setTimerIsRunning(true);
                    setHasUnsavedChanges(true);
                }
            };

            const pauseTimer = () => {
                if (timerIsRunning && timerStartTime !== null) {
                    const elapsed = Date.now() - timerStartTime;
                    setTimerElapsed(elapsed);
                    setTimerPausedAt(Date.now());
                    setTimerIsRunning(false);
                }
            };

            const stopTimer = () => {
                if (timerIsRunning && timerStartTime !== null) {
                    const elapsed = Date.now() - timerStartTime;
                    setTimerElapsed(elapsed);
                }
                setTimerIsRunning(false);
                setTimerPausedAt(null);
            };

            const resetTimer = () => {
                setTimerStartTime(null);
                setTimerElapsed(0);
                setTimerPausedAt(null);
                setTimerIsRunning(false);
                setTimerDisplay('00:00');
            };

            const formatTimerDisplay = (milliseconds) => {
                const totalSeconds = Math.floor(milliseconds / 1000);
                const minutes = Math.floor(totalSeconds / 60);
                const seconds = totalSeconds % 60;
                return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            };

            // Update timer display
            useEffect(() => {
                let interval;
                if (timerIsRunning && timerStartTime !== null) {
                    interval = setInterval(() => {
                        const elapsed = Date.now() - timerStartTime;
                        setTimerElapsed(elapsed);
                        setTimerDisplay(formatTimerDisplay(elapsed));
                    }, 100);
                } else if (timerPausedAt !== null || timerElapsed > 0) {
                    setTimerDisplay(formatTimerDisplay(timerElapsed));
                }
                return () => {
                    if (interval) clearInterval(interval);
                };
            }, [timerIsRunning, timerStartTime, timerElapsed, timerPausedAt]);

            const togglePhoneme = (wordIndex, pIndex) => { setHasUnsavedChanges(true); const listId = activeTest.listId; const key = `${listId}_${wordIndex}_${pIndex}`; const wordData = activeStats.visibleWords.find(w => w.i === wordIndex); if (!wordData) return; setTests(prev => { const currentScores = prev[activeTestId].scores; const newScores = { ...currentScores }; const currentState = currentScores[key]; if (currentState === true) { newScores[key] = false; } else if (currentState === false) { newScores[key] = true; } else { newScores[key] = true; wordData.p.forEach((p, idx) => { if (p !== '-' && idx !== pIndex) { newScores[`${listId}_${wordIndex}_${idx}`] = false; } }); } return { ...prev, [activeTestId]: { ...prev[activeTestId], scores: newScores } }; }); };
            const setWordScore = (wordIndex, isCorrect) => { setHasUnsavedChanges(true); const listId = activeTest.listId; const wordData = activeStats.visibleWords.find(w => w.i === wordIndex); if (!wordData) return; setTests(prev => { const currentScores = { ...prev[activeTestId].scores }; let shouldClear = false; let currentIsAllCorrect = true; let currentIsAllIncorrect = true; let hasAnyScore = false; wordData.p.forEach((p, idx) => { if (p !== '-') { const val = currentScores[`${listId}_${wordIndex}_${idx}`]; if (val !== undefined) hasAnyScore = true; if (val !== true) currentIsAllCorrect = false; if (val !== false) currentIsAllIncorrect = false; } }); if (isCorrect && currentIsAllCorrect && hasAnyScore) shouldClear = true; if (!isCorrect && currentIsAllIncorrect && hasAnyScore) shouldClear = true; wordData.p.forEach((p, idx) => { if (p !== '-') { if (shouldClear) { delete currentScores[`${listId}_${wordIndex}_${idx}`]; } else { currentScores[`${listId}_${wordIndex}_${idx}`] = isCorrect; } } }); return { ...prev, [activeTestId]: { ...prev[activeTestId], scores: currentScores } }; }); };
            const toggleWordCorrect = (wordIndex) => { setHasUnsavedChanges(true); const listId = activeTest.listId; const wordData = activeStats.visibleWords.find(w => w.i === wordIndex); if (!wordData) return; setTests(prev => { const currentScores = { ...prev[activeTestId].scores }; let isFullyCorrect = true; wordData.p.forEach((p, idx) => { if (p !== '-' && !currentScores[`${listId}_${wordIndex}_${idx}`]) { isFullyCorrect = false; } }); wordData.p.forEach((p, idx) => { if (p !== '-') { if (isFullyCorrect) { delete currentScores[`${listId}_${wordIndex}_${idx}`]; } else { currentScores[`${listId}_${wordIndex}_${idx}`] = true; } } }); return { ...prev, [activeTestId]: { ...prev[activeTestId], scores: currentScores } }; }); };
            const markAll = (correct) => { setHasUnsavedChanges(true); const listData = activeStats.visibleWords; const listId = activeTest.listId; setTests(prev => { const newScores = { ...prev[activeTestId].scores }; listData.forEach(word => { word.p.forEach((phoneme, pIndex) => { if (phoneme === '-') return; const key = `${listId}_${word.i}_${pIndex}`; if (correct) newScores[key] = true; else delete newScores[key]; }); }); return { ...prev, [activeTestId]: { ...prev[activeTestId], scores: newScores, askedContinue: true } }; }); };



            const stopAudio = () => {
                if (currentAudioRef.current) {
                    currentAudioRef.current.pause();
                    currentAudioRef.current.currentTime = 0;
                    setAudioState('stopped');
                }
            };

            const pauseAudio = () => {
                if (currentAudioRef.current && audioState === 'playing') {
                    currentAudioRef.current.pause();
                    setAudioState('paused');
                }
            };

            const resumeAudio = () => {
                if (currentAudioRef.current && audioState === 'paused') {
                    currentAudioRef.current.play();
                    setAudioState('playing');
                }
            };

            const playAudio = (listId, wordIndex, wordText) => {
                // Stop any currently playing audio
                if (currentAudioRef.current) {
                    currentAudioRef.current.pause();
                    currentAudioRef.current.currentTime = 0;
                }

                let audioPath;
                let isBKB = false;

                if (listId && listId.startsWith('BKB')) {
                    isBKB = true;
                    const pairId = parseInt(listId.replace('BKB', ''));
                    const listData = BKB_SIN_LISTS_FULL[pairId];
                    if (!listData) {
                        alert("BKB List Data not found for pair " + pairId);
                        return;
                    }
                    const track = listData.track;
                    // Assuming file is in BKB-SIN folder at root
                    audioPath = `BKB-SIN/Track ${track}.wav`;
                    console.log("Playing BKB Track:", audioPath);
                } else {
                    const indexStr = String(wordIndex).padStart(2, '0');
                    const wordLower = wordText.toLowerCase();
                    const titleCaseWord = wordText.charAt(0).toUpperCase() + wordText.slice(1).toLowerCase();

                    if (['HF1', 'HF2', 'HF3', 'HF4'].includes(listId)) {
                        // C Series logic: '01_check.wav'
                        audioPath = `audio/${listId}/${indexStr}_${wordLower}.wav?v=${Date.now()}`;
                    } else if (listId === 'HF4B') {
                        // Special case for HF4B (List 4B)
                        audioPath = `audio/HF4B/List4B_${titleCaseWord}.wav?v=${Date.now()}`;
                    } else {
                        // Standard logic for 1A, 2A, 3A, 4A: '01_Check.wav'
                        audioPath = `audio/${listId}/${indexStr}_${titleCaseWord}.wav?v=${Date.now()}`;
                    }
                }

                const audio = new Audio(audioPath);
                // Set Volume to -5 dB (0.5623)
                audio.volume = 0.5623;

                // Store ref
                currentAudioRef.current = audio;

                // Pan Logic
                // If BKB (Split Track), force Stereo (0) to preserve L/R split.
                // Otherwise use standard logic.
                const pan = isBKB ? 0 : (speechToBoth ? 0 : (channelSwap ? 1 : -1));
                console.log(`Audio Playing: ${audioPath}, Pan: ${pan}`);

                playSoundWithPan(audio, pan);

                audio.onended = () => {
                    setAudioState('stopped');
                };

                audio.play().then(() => {
                    setAudioState('playing');
                }).catch(e => {
                    console.error("Audio playback error:", e);
                    alert(`Could not play audio file: ${audioPath}\nError: ${e.message}\n(Check if file exists in correct folder)`);
                    setAudioState('stopped');
                });
            };

            const setBKBScore = (key, value) => {
                setHasUnsavedChanges(true);
                setTests(prev => {
                    const currentScores = { ...prev[activeTestId].scores };
                    currentScores[key] = value;
                    return { ...prev, [activeTestId]: { ...prev[activeTestId], scores: currentScores } };
                });
            };

            const toggleCalibration = (side) => {
                // If clicking the active side, stop it.
                if (calibrationMode === side) {
                    if (calibrationAudioRef.current) {
                        calibrationAudioRef.current.pause();
                        calibrationAudioRef.current.currentTime = 0;
                    }
                    setCalibrationMode('none');
                    return;
                }

                // If switching sides or starting new, stop current if exists
                if (calibrationAudioRef.current) {
                    calibrationAudioRef.current.pause();
                    calibrationAudioRef.current.currentTime = 0;
                }

                let audioPath = '';
                if (calibrationSignal === 'nu6_tone') {
                    audioPath = 'audio/calibration/1000-Hz Calibration Tone.wav';
                } else if (calibrationSignal === 'rh_hf_tone') {
                    audioPath = 'audio/calibration/000_Master_Calibration_1kHz.wav';
                } else if (calibrationSignal === 'rh_hf_ssn') {
                    // Use Global HF Noise containing spectrum of all 100 words (Forms 1-4)
                    audioPath = 'audio/calibration/Global_HF_MasterNoise.wav';
                } else if (calibrationSignal === 'rh_hf_noise') {
                    audioPath = 'audio/calibration/pink_noise_4kHz_12kHz_cal_23dBFS.wav';
                } else if (calibrationSignal === 'bkb_noise') {
                    audioPath = 'BKB-SIN/21 - Speech Spectrum Noise.flac';
                }

                const audio = new Audio(audioPath);
                audio.loop = true;
                // Set Calibration Volume to -5 dB to match Speech reference level
                audio.volume = 0.5623;

                // Hard pan based on side requested: Left = -1, Right = 1
                const pan = side === 'left' ? -1 : 1;
                playSoundWithPan(audio, pan);

                calibrationAudioRef.current = audio;
                audio.play().then(() => {
                    setCalibrationMode(side);
                }).catch(e => {
                    console.error("Calibration playback error:", e);
                    alert(`Could not play calibration file: ${audioPath}\nError: ${e.message}`);
                    setCalibrationMode('none');
                });
            };


            const calculateVolumeFromSNR = (snr) => {
                // SNR = Signal - Noise
                // Assuming Signal is constant max (0 dB relative), Noise level needs to be lower.
                // However, convention often implies:
                // -5 dB SNR -> Noise is 5 dB LOUDER than signal? Or Signal is 5 dB lower than noise?
                // Usually in these tests, "0 dB SNR" means Signal and Noise are equal RMS.
                // "-5 dB SNR" means Noise is 5 dB louder than Signal.
                // "+10 dB SNR" means Signal is 10 dB louder than Noise (Noise is -10 dB relative to Signal).

                // Let's assume Signal is playback at 1.0 (or calibrated level).
                // We want to attenuate Noise relative to that.
                // Noise Level relative to Signal = -SNR.
                // If SNR is -5, Noise Level is +5 dB (relative to signal). 
                // Wait, if Signal is max 1.0, we can't boost Noise above 1.0 without clipping if both are maxed.
                // BUT, calibration file is likely -20 dBFS or similar. 
                // The prompt asked for: "-5 dB SNR to +25 dB SNR".
                // And "-5 dB is the loudest (max volume)".
                // So we map -5 SNR -> 1.0 Volume.
                // Formula: 
                // At SNR = -5, Attenuation = 0 dB -> Volume 1.0
                // At SNR = X, Attenuation = (X - (-5)) = X + 5 dB.
                // Actual Volume factor = 10 ^ ( - (Attenuation) / 20 )
                // Volume = 10 ^ ( - (snr + 5) / 20 )

                const attenuation = snr + 5;
                const volume = Math.pow(10, -attenuation / 20);
                // Clamp just in case
                return Math.min(Math.max(volume, 0), 1);
            };

            const toggleNoise = () => {
                if (isPlayingNoise) {
                    if (noiseAudioRef.current) {
                        noiseAudioRef.current.pause();
                        noiseAudioRef.current.currentTime = 0;
                    }
                    setIsPlayingNoise(false);
                } else {
                    const listId = activeTest.listId;
                    if (!['HF1', 'HF2', 'HF3', 'HF4'].includes(listId)) return;

                    const audioPath = `audio/noise/${listId}_MasterNoise.wav`;
                    const audio = new Audio(audioPath);
                    audio.loop = true;
                    audio.volume = calculateVolumeFromSNR(snrLevel);

                    // Noise panning:
                    // Default (channelSwap=true) is Left (-1)
                    // Swapped (channelSwap=false) is Right (1)
                    const pan = channelSwap ? -1 : 1;
                    console.log(`Noise Playing: ${listId}, Pan: ${pan} (Swap: ${channelSwap})`);
                    playSoundWithPan(audio, pan);

                    noiseAudioRef.current = audio;
                    audio.play().then(() => {
                        setIsPlayingNoise(true);
                    }).catch(e => {
                        console.error("Noise playback error:", e);
                        alert(`Could not play noise file: ${audioPath}\nError: ${e.message}`);
                        setIsPlayingNoise(false);
                    });
                }
            };

            const handleSNRChange = (e) => {
                const snr = parseInt(e.target.value, 10);
                setSnrLevel(snr);
                if (noiseAudioRef.current) {
                    noiseAudioRef.current.volume = calculateVolumeFromSNR(snr);
                }
            };

            const resetForm = () => {
                // Stop audio if playing
                if (noiseAudioRef.current) {
                    noiseAudioRef.current.pause();
                    noiseAudioRef.current.currentTime = 0;
                }
                setIsPlayingNoise(false);

                if (calibrationAudioRef.current) {
                    calibrationAudioRef.current.pause();
                    calibrationAudioRef.current.currentTime = 0;
                }
                setCalibrationMode('none');

                setCurrentTestId(null);
                setFirstName('');
                setLastName('');
                resetTimer();
                setOutcome('Sold');
                setNotSoldReason('Price');
                setSoldType('Private Pay');
                setOutcomeMode('Demo');
                setIoiHaScore('');
                setCNumber('');
                setDateOfBirth('');
                setTestDate(new Date().toISOString().split('T')[0]);
                setTests({
                    A: { id: 'A', listId: 'HF1', section: 'full', scoringMode: 'phoneme', condition: 'Unaided', deviceModel: '', level: '', snr: '', tnt: '', stimulusPresentation: 'Recording', scores: {}, limitTo10: false, askedContinue: false },
                    B: { id: 'B', listId: 'HF2', section: 'full', scoringMode: 'phoneme', condition: 'New Tech', deviceModel: '', level: '', snr: '', tnt: '', stimulusPresentation: 'Recording', scores: {}, limitTo10: false, askedContinue: false },
                    comparativeEase: 5
                });
                setActiveTestId('A');
                setActiveTab('scoring');
                setConfidenceLevel(80);
                setClinicalNotes('');
                setClearConfirm(false);
                setHasUnsavedChanges(false);
                localStorage.removeItem('nu6_draft_recovery');
            };

            const handleSave = async () => {
                if (!patientName.trim()) { alert("Please enter a Patient Name."); return; }
                if (!testDate) { alert("Please set a Test Date before saving."); return; }
                if (!testDate) { alert("Please set a Test Date before saving."); return; }
                const data = { id: currentTestId, patientName, cNumber, dateOfBirth, testDate, tests, activeTestId, activeTab, confidenceLevel, timerElapsed, outcome, notSoldReason, soldType, outcomeMode, ioiHaScore, clinicalNotes };
                try {
                    try {
                        const savedId = await window.SecureDB.saveTest(data);
                        setCurrentTestId(savedId);
                        setHasUnsavedChanges(false);
                        setLastSaved(new Date());
                        localStorage.removeItem('nu6_draft_recovery');
                        alert("Test encrypted and saved to local database successfully!");
                    } catch (e) {
                        if (e && e.code === 'DUPLICATE_DATE') {
                            // Prompt user to overwrite existing same-date record
                            if (confirm('A different test exists for this patient on the same date. Overwrite it?')) {
                                const savedId = await window.SecureDB.saveTest(data, { overwriteExistingSameDate: true });
                                setCurrentTestId(savedId);
                                setHasUnsavedChanges(false);
                                setLastSaved(new Date());
                                localStorage.removeItem('nu6_draft_recovery');
                                alert('Existing record overwritten and saved successfully.');
                            } else {
                                // User cancelled - do nothing
                                return;
                            }
                        } else {
                            throw e;
                        }
                    }
                } catch (e) {
                    console.error('Save error', e);
                    alert('Failed to save to local database. ' + (e && e.message ? e.message : ''));
                }
            };

            const handleAutoSave = async () => {
                if (!patientName.trim() || !testDate || !hasUnsavedChanges) return;
                const data = { id: currentTestId, patientName, cNumber, dateOfBirth, testDate, tests, activeTestId, activeTab, confidenceLevel, timerElapsed, outcome, notSoldReason, soldType, outcomeMode, ioiHaScore };
                try {
                    const savedId = await window.SecureDB.saveTest(data, currentTestId ? { overwriteExistingSameDate: true } : {});
                    setCurrentTestId(savedId);
                    setHasUnsavedChanges(false);
                    setLastSaved(new Date());
                    localStorage.removeItem('nu6_draft_recovery');
                } catch (e) {
                    console.error('Auto-save error', e);
                    // Silent failure for auto-save - don't interrupt user
                }
            };

            const handleLoadTest = (loadedData) => {
                if (loadedData) {
                    setCurrentTestId(loadedData.id);
                    // Load timer data if present
                    if (loadedData.timerElapsed !== undefined) {
                        setTimerElapsed(loadedData.timerElapsed);
                        setTimerDisplay(formatTimerDisplay(loadedData.timerElapsed));
                        setTimerIsRunning(false);
                        setTimerPausedAt(null);
                        setTimerStartTime(null);
                    }
                    // Load outcome data if present
                    if (loadedData.outcome !== undefined) setOutcome(loadedData.outcome);
                    if (loadedData.notSoldReason !== undefined) setNotSoldReason(loadedData.notSoldReason);
                    if (loadedData.soldType !== undefined) setSoldType(loadedData.soldType);
                    if (loadedData.outcomeMode !== undefined) setOutcomeMode(loadedData.outcomeMode);
                    if (loadedData.ioiHaScore !== undefined) setIoiHaScore(loadedData.ioiHaScore);
                    // Populate first/last name from explicit fields if present, otherwise split existing patientName
                    let lf = '';
                    let ll = '';
                    if (loadedData.firstName !== undefined || loadedData.lastName !== undefined) {
                        lf = loadedData.firstName || '';
                        ll = loadedData.lastName || '';
                    } else if (loadedData.patientName) {
                        const parts = (loadedData.patientName || '').trim().split(/\s+/);
                        lf = parts.shift() || '';
                        ll = parts.join(' ') || '';
                    }
                    setFirstName(lf);
                    setLastName(ll);
                    setCNumber(loadedData.cNumber || ''); setDateOfBirth(loadedData.dateOfBirth || ''); setTestDate(loadedData.testDate || new Date().toISOString().split('T')[0]); setTests(loadedData.tests); setActiveTestId(loadedData.activeTestId || 'A'); setActiveTab(loadedData.activeTab || 'scoring'); if (loadedData.confidenceLevel) setConfidenceLevel(loadedData.confidenceLevel); setClinicalNotes(loadedData.clinicalNotes || ''); setHasUnsavedChanges(false);
                }
            };
            const handleDeleteCurrentRecord = async () => { if (!currentTestId) return; if (confirm("Are you sure you want to delete this record from the database?")) { try { await window.SecureDB.deleteTest(currentTestId); alert("Record deleted."); resetForm(); } catch (e) { console.error(e); alert("Failed to delete record."); } } };

            const handleDeleteAllDb = async () => {
                if (!confirm('This will permanently remove ALL patient records from the local database but will preserve clinic settings. Continue?')) return;
                try {
                    await window.SecureDB.deleteAllTests();
                    alert('Database cleared. Clinic settings preserved.');
                    resetForm();
                } catch (e) {
                    console.error('Failed to delete database:', e);
                    alert('Failed to delete database.');
                }
            };
            // Open export modal to choose export type
            const handleExportDB = () => {
                setShowExportModal(true);
            };

            // Export encrypted with password (AES-256)
            // Process export data for individual or aggregate analysis
            const processExportData = (data, mode) => {
                if (mode === 'individual') {
                    // Flatten to individual test records
                    const flatData = [];
                    data.forEach(record => {
                        if (record.tests) {
                            // Calculate stats for both tests
                            const statsA = calculateStats(record.tests.A.listId, record.tests.A.section, record.tests.A.scores, record.tests.A.limitTo10);
                            const statsB = calculateStats(record.tests.B.listId, record.tests.B.section, record.tests.B.scores, record.tests.B.limitTo10);

                            // Get confidence level (default to 95 if not set)
                            const confidenceLevel = record.confidenceLevel || 95;

                            // Calculate critical limits for word scores
                            const wordCriticalLimits = statsA.totalWords > 0
                                ? getCriticalLimits(statsA.wordPercent, statsA.totalWords, confidenceLevel)
                                : { lower: 0, upper: 100 };

                            // Check if word difference is significant
                            const isWordDiffSig = statsB.wordPercent < wordCriticalLimits.lower || statsB.wordPercent > wordCriticalLimits.upper;

                            // Calculate critical limits for phoneme scores (if both use phoneme scoring)
                            let isPhonemeDiffSig = 'N/A';
                            let phonemeCriticalLower = 'N/A';
                            let phonemeCriticalUpper = 'N/A';

                            if (record.tests.A.scoringMode === 'phoneme' && record.tests.B.scoringMode === 'phoneme' && statsA.totalPhonemes > 0) {
                                const rawPercent = (statsA.correctPhonemes / statsA.totalPhonemes) * 100;
                                const phonemeCriticalLimits = getCriticalLimits(rawPercent, statsA.totalPhonemes, confidenceLevel, true);
                                phonemeCriticalLower = phonemeCriticalLimits.lower.toFixed(1);
                                phonemeCriticalUpper = phonemeCriticalLimits.upper.toFixed(1);
                                isPhonemeDiffSig = statsB.phonemePercent < phonemeCriticalLimits.lower || statsB.phonemePercent > phonemeCriticalLimits.upper ? 'Yes' : 'No';
                            }

                            // Calculate score differences
                            const wordDifference = statsB.wordPercent - statsA.wordPercent;
                            const phonemeDifference = statsB.phonemePercent - statsA.phonemePercent;

                            // TNT calculations
                            const parseTNTForExport = (tntString) => {
                                if (!tntString) return null;
                                const match = tntString.match(/([+-]?\d+\.?\d*)/);
                                return match ? parseFloat(match[1]) : null;
                            };
                            const tntAVal = parseTNTForExport(record.tests.A.tnt);
                            const tntBVal = parseTNTForExport(record.tests.B.tnt);
                            const tntDiff = (tntAVal !== null && tntBVal !== null) ? Math.abs(tntBVal - tntAVal) : null;
                            const tntSig = tntDiff !== null && tntDiff > 1.5 ? 'Yes' : (tntDiff !== null ? 'No' : 'N/A');

                            // Comparative ease of listening
                            const comparativeEase = record.tests.comparativeEase !== undefined ? record.tests.comparativeEase : 'N/A';
                            const easeDelta = comparativeEase !== 'N/A' ? comparativeEase - 5 : 'N/A';

                            // Common fields for this record
                            const commonFields = {
                                PatientID: record.cNumber || 'N/A',
                                Date: record.testDate || 'N/A',
                                ConditionA: record.tests.A.condition || 'N/A',
                                ConditionB: record.tests.B.condition || 'N/A',
                                WordScoreDifference: wordDifference,
                                WordSignificant: isWordDiffSig ? 'Yes' : 'No',
                                WordCriticalLower: wordCriticalLimits.lower,
                                WordCriticalUpper: wordCriticalLimits.upper,
                                PhonemeScoreDifference: phonemeDifference,
                                PhonemeSignificant: isPhonemeDiffSig,
                                PhonemeCriticalLower: phonemeCriticalLower,
                                PhonemeCriticalUpper: phonemeCriticalUpper,
                                TNTDifference: tntDiff !== null ? tntDiff.toFixed(2) : 'N/A',
                                TNTSignificant: tntSig,
                                ComparativeEase: comparativeEase,
                                EaseDelta: easeDelta,
                                ConfidenceLevel: confidenceLevel + '%',
                                Outcome: record.outcome || 'N/A',
                                SoldType: record.soldType || 'N/A',
                                NotSoldReason: record.notSoldReason || 'N/A',
                                OutcomeMode: record.outcomeMode || 'Demo',
                                IOI_HA_Score: record.ioiHaScore || 'N/A',
                                TimerDuration: record.timerElapsed ? formatTimerDisplay(record.timerElapsed) : 'N/A'
                            };

                            // Test A
                            flatData.push({
                                ...commonFields,
                                Ear: 'A',
                                List: record.tests.A.listId,
                                Section: record.tests.A.section,
                                WordScore: statsA.wordPercent,
                                PhonemeScore: statsA.phonemePercent,
                                StimulusPresentation: record.tests.A.stimulusPresentation || 'N/A',
                                ScoringMode: record.tests.A.scoringMode || 'N/A',
                                TNT: record.tests.A.tnt || 'N/A'
                            });

                            // Test B
                            flatData.push({
                                ...commonFields,
                                Ear: 'B',
                                List: record.tests.B.listId,
                                Section: record.tests.B.section,
                                WordScore: statsB.wordPercent,
                                PhonemeScore: statsB.phonemePercent,
                                StimulusPresentation: record.tests.B.stimulusPresentation || 'N/A',
                                ScoringMode: record.tests.B.scoringMode || 'N/A',
                                TNT: record.tests.B.tnt || 'N/A'
                            });
                        }
                    });
                    return flatData;
                } else if (mode === 'aggregate') {
                    // Group by comparison type (Unaided vs New Tech, Current Tech vs New Tech)
                    const grouped = {};

                    data.forEach(record => {
                        if (record.tests) {
                            const confidenceLevel = record.confidenceLevel || 95;

                            // Calculate stats for both tests
                            const statsA = calculateStats(record.tests.A.listId, record.tests.A.section, record.tests.A.scores, record.tests.A.limitTo10);
                            const statsB = calculateStats(record.tests.B.listId, record.tests.B.section, record.tests.B.scores, record.tests.B.limitTo10);

                            // Calculate score differences (B - A)
                            const wordDifference = statsB.wordPercent - statsA.wordPercent;
                            const phonemeDifference = statsB.phonemePercent - statsA.phonemePercent;

                            // Get comparative ease of listening
                            const comparativeEase = record.tests.comparativeEase !== undefined ? record.tests.comparativeEase : null;

                            // Get outcome
                            const outcome = record.outcome || null;

                            // Determine comparison type
                            const condA = record.tests.A.condition || 'Unaided';
                            const condB = record.tests.B.condition || 'New Tech';
                            const comparisonKey = `${condA} vs ${condB}`;

                            // Calculate critical limits and significance for word scores
                            const wordCriticalLimits = statsA.totalWords > 0
                                ? getCriticalLimits(statsA.wordPercent, statsA.totalWords, confidenceLevel)
                                : { lower: 0, upper: 100 };
                            const isWordSignificant = statsB.wordPercent < wordCriticalLimits.lower || statsB.wordPercent > wordCriticalLimits.upper;

                            // Calculate critical limits and significance for phoneme scores (if both use phoneme scoring)
                            let isPhonemeSignificant = null;
                            if (record.tests.A.scoringMode === 'phoneme' && record.tests.B.scoringMode === 'phoneme' && statsA.totalPhonemes > 0) {
                                const rawPercent = (statsA.correctPhonemes / statsA.totalPhonemes) * 100;
                                const phonemeCriticalLimits = getCriticalLimits(rawPercent, statsA.totalPhonemes, confidenceLevel, true);
                                isPhonemeSignificant = statsB.phonemePercent < phonemeCriticalLimits.lower || statsB.phonemePercent > phonemeCriticalLimits.upper;
                            }

                            if (!grouped[comparisonKey]) {
                                grouped[comparisonKey] = {
                                    wordScoresA: [],
                                    wordScoresB: [],
                                    phonemeScoresA: [],
                                    phonemeScoresB: [],
                                    wordDifferences: [],
                                    phonemeDifferences: [],
                                    wordSignificant: [],
                                    phonemeSignificant: [],
                                    comparativeEase: [],
                                    outcomes: [],
                                    dates: [],
                                    timerDurations: []
                                };
                            }

                            grouped[comparisonKey].wordScoresA.push(statsA.wordPercent);
                            grouped[comparisonKey].wordScoresB.push(statsB.wordPercent);
                            grouped[comparisonKey].phonemeScoresA.push(statsA.phonemePercent);
                            grouped[comparisonKey].phonemeScoresB.push(statsB.phonemePercent);
                            grouped[comparisonKey].wordDifferences.push(wordDifference);
                            grouped[comparisonKey].phonemeDifferences.push(phonemeDifference);
                            grouped[comparisonKey].wordSignificant.push(isWordSignificant ? 1 : 0);

                            if (isPhonemeSignificant !== null) {
                                grouped[comparisonKey].phonemeSignificant.push(isPhonemeSignificant ? 1 : 0);
                            }
                            if (comparativeEase !== null) {
                                grouped[comparisonKey].comparativeEase.push(comparativeEase);
                            }
                            if (outcome !== null) {
                                grouped[comparisonKey].outcomes.push(outcome);
                            }
                            if (record.testDate) {
                                grouped[comparisonKey].dates.push(record.testDate);
                            }
                            if (record.timerElapsed) {
                                grouped[comparisonKey].timerDurations.push(record.timerElapsed);
                            }
                        }
                    });

                    // Calculate statistics for each comparison type
                    const aggregateData = Object.keys(grouped).map(comparisonKey => {
                        const wordScoresA = grouped[comparisonKey].wordScoresA;
                        const wordScoresB = grouped[comparisonKey].wordScoresB;
                        const phonemeScoresA = grouped[comparisonKey].phonemeScoresA;
                        const phonemeScoresB = grouped[comparisonKey].phonemeScoresB;
                        const wordDiffs = grouped[comparisonKey].wordDifferences;
                        const phonemeDiffs = grouped[comparisonKey].phonemeDifferences;
                        const wordSig = grouped[comparisonKey].wordSignificant;
                        const phonemeSig = grouped[comparisonKey].phonemeSignificant;
                        const compEase = grouped[comparisonKey].comparativeEase;
                        const outcomes = grouped[comparisonKey].outcomes;
                        const dates = grouped[comparisonKey].dates;
                        const timerDurations = grouped[comparisonKey].timerDurations;

                        // Calculate mean scores
                        const meanWordA = wordScoresA.length > 0 ? wordScoresA.reduce((a, b) => a + b, 0) / wordScoresA.length : 0;
                        const meanWordB = wordScoresB.length > 0 ? wordScoresB.reduce((a, b) => a + b, 0) / wordScoresB.length : 0;
                        const meanPhonemeA = phonemeScoresA.length > 0 ? phonemeScoresA.reduce((a, b) => a + b, 0) / phonemeScoresA.length : 0;
                        const meanPhonemeB = phonemeScoresB.length > 0 ? phonemeScoresB.reduce((a, b) => a + b, 0) / phonemeScoresB.length : 0;

                        // Calculate mean differences (B - A)
                        const meanWordDiff = wordDiffs.length > 0
                            ? Number((wordDiffs.reduce((a, b) => a + b, 0) / wordDiffs.length).toFixed(2))
                            : null;
                        const meanPhonemeDiff = phonemeDiffs.length > 0
                            ? Number((phonemeDiffs.reduce((a, b) => a + b, 0) / phonemeDiffs.length).toFixed(2))
                            : null;

                        // Calculate percentage of significant differences
                        const wordSigPercent = wordSig.length > 0
                            ? Number(((wordSig.reduce((a, b) => a + b, 0) / wordSig.length) * 100).toFixed(1))
                            : null;
                        const phonemeSigPercent = phonemeSig.length > 0
                            ? Number(((phonemeSig.reduce((a, b) => a + b, 0) / phonemeSig.length) * 100).toFixed(1))
                            : null;

                        // Calculate mean comparative ease if present
                        const meanCompEase = compEase.length > 0
                            ? Number((compEase.reduce((a, b) => a + b, 0) / compEase.length).toFixed(2))
                            : null;

                        // Count outcomes
                        const outcomeCounts = {};
                        outcomes.forEach(outcome => {
                            outcomeCounts[outcome] = (outcomeCounts[outcome] || 0) + 1;
                        });
                        const outcomeStr = Object.entries(outcomeCounts)
                            .map(([outcome, count]) => `${outcome}: ${count}`)
                            .join('; ') || null;

                        // Calculate date range
                        let dateRange = null;
                        if (dates.length > 0) {
                            const sortedDates = dates.map(d => new Date(d)).sort((a, b) => a - b);
                            const earliest = sortedDates[0].toISOString().split('T')[0];
                            const latest = sortedDates[sortedDates.length - 1].toISOString().split('T')[0];
                            dateRange = earliest === latest ? earliest : `${earliest} to ${latest}`;
                        }

                        // Calculate average timer duration
                        let avgTimerDuration = null;
                        if (timerDurations.length > 0) {
                            const avgMs = timerDurations.reduce((a, b) => a + b, 0) / timerDurations.length;
                            avgTimerDuration = formatTimerDisplay(avgMs);
                        }

                        return {
                            Comparison: comparisonKey,
                            Count: wordScoresA.length,
                            DateRange: dateRange,
                            MeanWordScoreA: Number(meanWordA.toFixed(2)),
                            MeanWordScoreB: Number(meanWordB.toFixed(2)),
                            MeanWordDifference: meanWordDiff,
                            WordSignificantPercent: wordSigPercent,
                            MeanPhonemeScoreA: Number(meanPhonemeA.toFixed(2)),
                            MeanPhonemeScoreB: Number(meanPhonemeB.toFixed(2)),
                            MeanPhonemeDifference: meanPhonemeDiff,
                            PhonemeSignificantPercent: phonemeSigPercent,
                            MeanComparativeEase: meanCompEase,
                            AvgTimerDuration: avgTimerDuration,
                            Outcomes: outcomeStr
                        };
                    });

                    return aggregateData;
                }

                return [];
            };

            // Download data as CSV file
            const downloadAsCSV = (filename, dataArray) => {
                if (!dataArray || dataArray.length === 0) {
                    alert('No data to export.');
                    return;
                }

                // Extract headers from first object
                const headers = Object.keys(dataArray[0]);

                // Helper function to escape CSV values
                const escapeCSV = (value) => {
                    if (value === null || value === undefined) return '';
                    const stringValue = String(value);
                    // Quote the value if it contains comma, quote, or newline
                    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
                        return `"${stringValue.replace(/"/g, '""')}"`;
                    }
                    return stringValue;
                };

                // Build CSV string
                let csvContent = '';

                // Add headers
                csvContent += headers.map(escapeCSV).join(',') + '\n';

                // Add data rows
                dataArray.forEach(row => {
                    csvContent += headers.map(header => escapeCSV(row[header])).join(',') + '\n';
                });

                // Create Blob and trigger download
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            };

            // Helper function to decrypt a record (placeholder for actual decryption logic)
            const decryptRecord = async (record) => {
                // In this implementation, SecureDB already returns decrypted records
                // This function exists for extensibility if raw encrypted records need processing
                return record;
            };

            // Handle export click for CSV export
            const handleExportClick = async (mode) => {
                try {
                    // Fetch all records from IndexedDB
                    const records = await window.SecureDB.getAllTests();

                    if (!records || records.length === 0) {
                        alert('No records found to export.');
                        return;
                    }

                    // Decrypt records (if needed)
                    let decryptedData = await Promise.all(
                        records.map(record => decryptRecord(record))
                    );

                    // Filter by date range if specified
                    if (exportStartDate || exportEndDate) {
                        decryptedData = decryptedData.filter(record => {
                            if (!record.testDate) return false;
                            const recordDate = new Date(record.testDate);
                            if (exportStartDate && recordDate < new Date(exportStartDate)) return false;
                            if (exportEndDate && recordDate > new Date(exportEndDate)) return false;
                            return true;
                        });

                        if (decryptedData.length === 0) {
                            alert('No records found in the specified date range.');
                            return;
                        }
                    }

                    // Process data based on mode
                    const processedData = processExportData(decryptedData, mode);

                    if (!processedData || processedData.length === 0) {
                        alert('No data to export after processing.');
                        return;
                    }

                    // Generate filename based on mode
                    const timestamp = new Date().toISOString().split('T')[0];
                    const filename = mode === 'individual'
                        ? `NU6_Individual_Export_${timestamp}.csv`
                        : `NU6_Aggregate_Export_${timestamp}.csv`;

                    // Download as CSV
                    downloadAsCSV(filename, processedData);

                    alert(`Export complete! Downloaded ${processedData.length} row(s).`);
                } catch (err) {
                    console.error('Export failed:', err);
                    alert('Failed to export data: ' + (err.message || 'Unknown error'));
                }
            };

            const handleExportEncrypted = () => {
                setShowExportPasswordModal(true);
                setExportPassword('');
                setShowExportModal(false);
            };

            const confirmExportEncrypted = async () => {
                try {
                    const password = exportPassword;
                    if (!password) { alert('Export cancelled - no password provided.'); return; }
                    if (password.length < 8) { alert('Password must be at least 8 characters.'); return; }

                    const allData = await window.SecureDB.getAllTests();

                    // Encrypt entire dataset
                    const encrypted = await CryptoService.encryptData(allData, password);
                    const exportObj = { version: '1.0', encrypted: true, data: encrypted };
                    const jsonString = JSON.stringify(exportObj, null, 2);
                    const blob = new Blob([jsonString], { type: "application/json" });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `NU6_Encrypted_Export_${new Date().toISOString().split('T')[0]}.json`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    setShowExportPasswordModal(false);
                    alert('Encrypted export complete. Keep your password safe!');
                } catch (err) {
                    console.error('Encrypted export failed:', err);
                    alert('Failed to export encrypted database: ' + (err.message || 'Unknown error'));
                }
            };

            // Export de-identified (remove PHI)
            const handleExportDeidentified = async () => {
                try {
                    const allData = await window.SecureDB.getAllTests();
                    const deidentified = allData.map(record => {
                        const { patientName, dateOfBirth, ...rest } = record;
                        let age = null;
                        if (dateOfBirth && record.testDate) {
                            age = computeAgeYears(dateOfBirth, record.testDate);
                        }
                        return {
                            ...rest,
                            patientName: '[REDACTED]',
                            dateOfBirth: null,
                            age: age !== null && age >= 90 ? '90+' : age
                        };
                    });
                    const jsonString = JSON.stringify(deidentified, null, 2);
                    const blob = new Blob([jsonString], { type: "application/json" });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `NU6_Deidentified_Export_${new Date().toISOString().split('T')[0]}.json`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    setShowExportModal(false);
                    alert('De-identified export complete (PHI removed).');
                } catch (err) {
                    console.error('De-identified export failed:', err);
                    alert('Failed to export de-identified database.');
                }
            };

            // Export to FHIR JSON
            const handleExportFHIR = async () => {
                try {
                    // Fetch all records from IndexedDB
                    const records = await window.SecureDB.getAllTests();

                    if (!records || records.length === 0) {
                        alert('No records found to export.');
                        return;
                    }

                    // Define the FHIR Bundle
                    const bundle = {
                        resourceType: "Bundle",
                        type: "collection",
                        entry: []
                    };

                    const generateUUID = () => {
                        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                            var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
                            return v.toString(16);
                        });
                    };

                    // Format date to FHIR dateTime (YYYY-MM-DD or full ISO depending on what we have)
                    const formatFHIRDate = (dateStr) => {
                        if (!dateStr) return new Date().toISOString().split('T')[0];
                        return dateStr;
                    };

                    // Process each record
                    records.forEach(record => {
                        if (!record.tests) return;

                        const patientId = generateUUID();
                        const patientNameParts = record.patientName ? record.patientName.split(' ') : ['Unknown'];
                        const familyName = patientNameParts.length > 1 ? patientNameParts.pop() : 'Unknown';
                        const givenNames = patientNameParts.length > 0 ? patientNameParts : ['Unknown'];

                        // 1. Create Patient Resource
                        const patientResource = {
                            fullUrl: `urn:uuid:${patientId}`,
                            resource: {
                                resourceType: "Patient",
                                id: patientId,
                                text: {
                                    status: "generated",
                                    div: `<div xmlns="http://www.w3.org/1999/xhtml">${record.patientName || 'Unknown Patient'}</div>`
                                },
                                identifier: record.cNumber ? [
                                    {
                                        use: "usual",
                                        type: { text: "Clinic Number" },
                                        value: record.cNumber
                                    }
                                ] : undefined,
                                name: [
                                    {
                                        use: "official",
                                        family: familyName,
                                        given: givenNames,
                                        text: record.patientName
                                    }
                                ],
                                birthDate: record.dateOfBirth || undefined
                            }
                        };
                        bundle.entry.push(patientResource);

                        // Calculate stats for tests
                        const statsA = calculateStats(record.tests.A.listId, record.tests.A.section, record.tests.A.scores, record.tests.A.limitTo10);
                        const statsB = calculateStats(record.tests.B.listId, record.tests.B.section, record.tests.B.scores, record.tests.B.limitTo10);

                        // 2. Create DiagnosticReport
                        const reportId = generateUUID();
                        const reportResource = {
                            fullUrl: `urn:uuid:${reportId}`,
                            resource: {
                                resourceType: "DiagnosticReport",
                                id: reportId,
                                status: "final",
                                code: {
                                    coding: [
                                        {
                                            system: "http://snomed.info/sct",
                                            code: "252560006",
                                            display: "Speech audiometry (procedure)"
                                        }
                                    ],
                                    text: "NU-6 Speech Audiometry Test"
                                },
                                subject: {
                                    reference: `urn:uuid:${patientId}`,
                                    display: record.patientName
                                },
                                effectiveDateTime: formatFHIRDate(record.testDate),
                                result: [], // Will hold references to Observations
                                conclusion: record.clinicalNotes || undefined
                            }
                        };

                        const observations = [];

                        // Helper to generate Observation
                        const createObservation = (testLabel, testData, stats) => {
                            if (!testData || !stats || stats.totalWords === 0) return;

                            const obsId = generateUUID();

                            // Reference this observation in the report
                            reportResource.resource.result.push({ reference: `urn:uuid:${obsId}` });

                            const components = [
                                {
                                    code: { text: "Word Recognition Score" },
                                    valueQuantity: {
                                        value: stats.wordPercent,
                                        unit: "%",
                                        system: "http://unitsofmeasure.org",
                                        code: "%"
                                    }
                                },
                                {
                                    code: { text: "Words Correct" },
                                    valueQuantity: {
                                        value: stats.correctWords,
                                        unit: "{words}",
                                        system: "http://unitsofmeasure.org",
                                        code: "{words}"
                                    }
                                },
                                {
                                    code: { text: "Total Words Evaluated" },
                                    valueQuantity: {
                                        value: stats.totalWords,
                                        unit: "{words}",
                                        system: "http://unitsofmeasure.org",
                                        code: "{words}"
                                    }
                                }
                            ];

                            if (testData.scoringMode === 'phoneme' && stats.totalPhonemes > 0) {
                                components.push({
                                    code: { text: "Phoneme Recognition Score" },
                                    valueQuantity: {
                                        value: stats.phonemePercent,
                                        unit: "%",
                                        system: "http://unitsofmeasure.org",
                                        code: "%"
                                    }
                                });
                                components.push({
                                    code: { text: "Phonemes Correct" },
                                    valueQuantity: {
                                        value: stats.correctPhonemes,
                                        unit: "{phonemes}",
                                        system: "http://unitsofmeasure.org",
                                        code: "{phonemes}"
                                    }
                                });
                                components.push({
                                    code: { text: "Total Phonemes Evaluated" },
                                    valueQuantity: {
                                        value: stats.totalPhonemes,
                                        unit: "{phonemes}",
                                        system: "http://unitsofmeasure.org",
                                        code: "{phonemes}"
                                    }
                                });
                            }

                            if (testData.snr !== undefined && testData.snr !== '') {
                                components.push({
                                    code: { text: "Signal to Noise Ratio (SNR)" },
                                    valueQuantity: {
                                        value: Number(testData.snr),
                                        unit: "dB",
                                        system: "http://unitsofmeasure.org",
                                        code: "dB"
                                    }
                                });
                            }

                            const observation = {
                                fullUrl: `urn:uuid:${obsId}`,
                                resource: {
                                    resourceType: "Observation",
                                    id: obsId,
                                    status: "final",
                                    code: {
                                        coding: [
                                            {
                                                system: "http://snomed.info/sct",
                                                code: "117673004",
                                                display: "Word recognition score"
                                            }
                                        ],
                                        text: `NU-6 Word Recognition Score - Condition ${testLabel}: ${testData.condition || 'Unknown'} (${testData.listId})`
                                    },
                                    subject: {
                                        reference: `urn:uuid:${patientId}`,
                                        display: record.patientName
                                    },
                                    effectiveDateTime: formatFHIRDate(record.testDate),
                                    component: components
                                }
                            };
                            observations.push(observation);
                        };

                        createObservation("A", record.tests.A, statsA);
                        createObservation("B", record.tests.B, statsB);

                        bundle.entry.push(reportResource);
                        observations.forEach(obs => bundle.entry.push(obs));
                    });

                    const jsonString = JSON.stringify(bundle, null, 2);
                    const blob = new Blob([jsonString], { type: "application/json;charset=utf-8" });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `NU6_FHIR_Export_${new Date().toISOString().split('T')[0]}.json`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    setShowExportModal(false);
                    alert('FHIR (HL7 JSON) export complete.');

                } catch (err) {
                    console.error('FHIR export failed:', err);
                    alert('Failed to export FHIR database: ' + (err.message || 'Unknown error'));
                }
            };

            // Import DB: open source selection (simulated or upload)

            const handleImportDB = () => {
                setShowImportSourceModal(true);
            };

            // Choose to use simulated DB
            const handleUseSimulatedDB = () => {
                setImportPreviewRecords(SIMULATED_DB);
                setImportPreviewFileName('SIMULATED_DB.json');
                const invalidCount = SIMULATED_DB.filter(r => !r || !r.patientName || !r.testDate || !r.tests).length;
                setImportPreviewInvalidCount(invalidCount);
                setShowImportSourceModal(false);
                setShowImportPreviewModal(true);
            };

            // Choose to upload a file
            const handleUseFileUpload = () => {
                setShowImportSourceModal(false);
                if (fileInputRef && fileInputRef.current) fileInputRef.current.click();
            };

            // Handle the selected JSON file and show import preview
            const handleImportFile = async (e) => {
                const file = e?.target?.files?.[0];
                if (!file) return;
                try {
                    const text = await file.text();
                    let parsed = JSON.parse(text);

                    // Check if this is an encrypted export
                    if (parsed && parsed.encrypted === true && parsed.data) {
                        setEncryptedImportFile(parsed.data);
                        setShowEncryptedImportModal(true);
                        if (e && e.target) e.target.value = '';
                        return;
                    }

                    let records = [];
                    if (Array.isArray(parsed)) {
                        records = parsed;
                    } else if (parsed && parsed.entry && Array.isArray(parsed.entry)) {
                        // If some other bundle shape (e.g., FHIR-like), attempt to extract resources
                        records = parsed.entry.map(en => en.resource || en);
                    } else if (parsed && parsed.tests) {
                        records = [parsed];
                    } else {
                        alert("Invalid JSON format. Expected an array of test records exported from this app.");
                        if (e && e.target) {
                            e.target.value = '';
                        }
                        return;
                    }

                    if (records.length === 0) {
                        alert("No records found in file.");
                        if (e && e.target) {
                            e.target.value = '';
                        }
                        return;
                    }

                    const invalidCount = records.filter(r => !r || !r.patientName || !r.testDate || !r.tests).length;

                    // Set preview state and open modal
                    setImportPreviewRecords(records);
                    setImportPreviewFileName(file.name);
                    setImportPreviewInvalidCount(invalidCount);
                    setShowImportPreviewModal(true);

                } catch (err) {
                    console.error(err);
                    alert('Failed to parse file: ' + (err && err.message ? err.message : err));
                    if (e && e.target) {
                        e.target.value = '';
                    }
                }
            };

            // Perform the actual import (called by modal confirm actions)
            const mergeTestSections = (existing = {}, incoming = {}) => {
                return {
                    ...existing,
                    ...incoming,
                    scores: { ...(existing.scores || {}), ...(incoming.scores || {}) }
                };
            };

            const mergeRecordsById = (existing = {}, incoming = {}) => {
                const existingTests = existing.tests || {};
                const incomingTests = incoming.tests || {};
                const mergedTests = {
                    ...existingTests,
                    ...incomingTests,
                    A: mergeTestSections(existingTests.A || {}, incomingTests.A || {}),
                    B: mergeTestSections(existingTests.B || {}, incomingTests.B || {}),
                    comparativeEase: incomingTests.comparativeEase ?? existingTests.comparativeEase
                };

                return {
                    ...existing,
                    ...incoming,
                    id: existing.id || incoming.id,
                    patientName: incoming.patientName || existing.patientName || '',
                    cNumber: incoming.cNumber || existing.cNumber || '',
                    dateOfBirth: incoming.dateOfBirth || existing.dateOfBirth || '',
                    testDate: incoming.testDate || existing.testDate || '',
                    tests: mergedTests,
                    activeTestId: incoming.activeTestId ?? existing.activeTestId,
                    activeTab: incoming.activeTab ?? existing.activeTab,
                    confidenceLevel: incoming.confidenceLevel ?? existing.confidenceLevel
                };
            };

            const importRecords = async (mode) => {
                // mode: 'overwrite' | 'append' | 'skip' | 'merge'
                setShowImportPreviewModal(false);
                const records = importPreviewRecords || [];
                let imported = 0; let errors = 0; let skipped = 0;

                // Build existing maps for IDs and patient|date
                let existingIds = new Set();
                let existingById = new Map();
                let existingByPatientDate = new Map();
                try {
                    const existing = await window.SecureDB.getAllTests();
                    existingIds = new Set(existing.map(r => r.id));
                    existingById = new Map(existing.map(r => [r.id, r]));
                    for (const r of existing) {
                        const key = `${r.cNumber || r.patientName}||${r.testDate}`;
                        if (!existingByPatientDate.has(key)) existingByPatientDate.set(key, r.id);
                    }
                } catch (e) { console.error('Failed to fetch existing records for import checks', e); }

                for (const rec of records) {
                    try {
                        if (!rec) { errors++; continue; }
                        const recKey = `${rec.cNumber || rec.patientName}||${rec.testDate}`;
                        const existingIdForKey = existingByPatientDate.get(recKey);

                        // Skip duplicates by ID when mode=skip
                        if (mode === 'skip' && rec && rec.id && existingIds.has(rec.id)) {
                            skipped++;
                            continue;
                        }

                        if (mode === 'merge') {
                            if (rec.id && existingById.has(rec.id)) {
                                const merged = mergeRecordsById(existingById.get(rec.id), rec);
                                await window.SecureDB.saveTest(merged);
                                existingIds.add(rec.id);
                                existingById.set(rec.id, merged);
                                existingByPatientDate.set(recKey, rec.id);
                                imported++;
                                continue;
                            }

                            if (existingIdForKey && existingById.has(existingIdForKey)) {
                                const merged = mergeRecordsById(existingById.get(existingIdForKey), { ...rec, id: existingIdForKey });
                                await window.SecureDB.saveTest(merged);
                                existingIds.add(existingIdForKey);
                                existingById.set(existingIdForKey, merged);
                                existingByPatientDate.set(recKey, existingIdForKey);
                                imported++;
                                continue;
                            }

                            const savedId = await window.SecureDB.saveTest(rec);
                            const finalId = rec.id || savedId;
                            existingIds.add(finalId);
                            existingById.set(finalId, { ...rec, id: finalId });
                            existingByPatientDate.set(recKey, finalId);
                            imported++;
                            continue;
                        }

                        if (mode === 'append') {
                            // Do not append if same patient/date already exists
                            if (existingByPatientDate.has(recKey)) { skipped++; continue; }
                            const toSave = { ...rec };
                            delete toSave.id; // create new id
                            // default save will block same-date duplicates, but we pre-checked
                            const savedId = await window.SecureDB.saveTest(toSave);
                            const finalId = savedId || toSave.id;
                            existingIds.add(finalId);
                            existingById.set(finalId, { ...toSave, id: finalId });
                            existingByPatientDate.set(recKey, finalId);
                            imported++;
                        } else if (mode === 'overwrite') {
                            // Overwrite by ID if present, else overwrite any same patient/date
                            if (rec.id && existingIds.has(rec.id)) {
                                await window.SecureDB.saveTest(rec); // will overwrite because same id
                                existingIds.add(rec.id);
                                existingById.set(rec.id, rec);
                                existingByPatientDate.set(recKey, rec.id);
                                imported++;
                            } else if (existingByPatientDate.has(recKey)) {
                                // delete existing by patient/date and save incoming record (preserve its id)
                                const existingId = existingByPatientDate.get(recKey);
                                try { await window.SecureDB.deleteTest(existingId); } catch (e) { console.warn('Failed to delete existing by date', e); }
                                await window.SecureDB.saveTest(rec);
                                const finalId = rec.id || existingId;
                                existingIds.add(finalId);
                                existingById.set(finalId, { ...rec, id: finalId });
                                existingByPatientDate.set(recKey, finalId);
                                imported++;
                            } else {
                                // no match - just save
                                const savedId = await window.SecureDB.saveTest(rec);
                                const finalId = rec.id || savedId;
                                existingIds.add(finalId);
                                existingById.set(finalId, { ...rec, id: finalId });
                                existingByPatientDate.set(recKey, finalId);
                                imported++;
                            }
                        } else {
                            // fallback - treat as append
                            const toSave = { ...rec };
                            delete toSave.id;
                            const savedId = await window.SecureDB.saveTest(toSave);
                            const finalId = savedId || toSave.id;
                            existingIds.add(finalId);
                            existingById.set(finalId, { ...toSave, id: finalId });
                            existingByPatientDate.set(recKey, finalId);
                            imported++;
                        }
                    } catch (err) {
                        console.error('Import failed for record', rec, err);
                        errors++;
                    }
                }

                // Reset file input after a short delay to avoid Windows focus issues
                setTimeout(() => {
                    if (fileInputRef && fileInputRef.current) {
                        fileInputRef.current.value = '';
                    }
                }, 100);
                setImportPreviewRecords([]);
                setImportPreviewFileName('');
                setImportPreviewInvalidCount(0);
                alert(`Import complete. ${imported} records imported, ${skipped} skipped, ${errors} errors.`);

                // Fix Windows focus issue - restore focus to document body
                setTimeout(() => {
                    if (document.activeElement) {
                        document.activeElement.blur();
                    }
                    document.body.focus();
                    document.body.click();
                }, 150);
            };

            const resetTestOnly = () => {
                // Stop audio if playing
                if (noiseAudioRef.current) {
                    noiseAudioRef.current.pause();
                    noiseAudioRef.current.currentTime = 0;
                }
                setIsPlayingNoise(false);

                if (calibrationAudioRef.current) {
                    calibrationAudioRef.current.pause();
                    calibrationAudioRef.current.currentTime = 0;
                }
                setCalibrationMode('none');

                setCurrentTestId(null);
                // Keep patient info: firstName, lastName, cNumber, dateOfBirth
                resetTimer();
                setOutcome('Sold');
                setNotSoldReason('Price');
                setSoldType('Private Pay');
                setOutcomeMode('Demo');
                setIoiHaScore('');
                // Keep testDate? Usually same session. 
                // setTestDate(new Date().toISOString().split('T')[0]); 

                setTests({
                    A: { id: 'A', listId: 'HF1', section: 'full', scoringMode: 'phoneme', condition: 'Unaided', deviceModel: '', level: '', snr: '', tnt: '', stimulusPresentation: 'Recording', scores: {}, limitTo10: false, askedContinue: false },
                    B: { id: 'B', listId: 'HF2', section: 'full', scoringMode: 'phoneme', condition: 'New Tech', deviceModel: '', level: '', snr: '', tnt: '', stimulusPresentation: 'Recording', scores: {}, limitTo10: false, askedContinue: false },
                    comparativeEase: 5
                });
                setActiveTestId('A');
                setActiveTab('scoring');
                setConfidenceLevel(80);
                setClinicalNotes('');
                setClearConfirm(false);
                setHasUnsavedChanges(false);
                localStorage.removeItem('nu6_draft_recovery');
            };

            const handleOpenClick = () => fileInputRef.current.click(); // Unused
            // clearAllData now acts as "Start Fresh" for New Patient
            const clearAllData = () => { resetForm(); };

            // Track unsaved changes and expose to Electron main process
            useEffect(() => {
                // Expose state to main process for close event handling
                window.hasUnsavedChanges = hasUnsavedChanges;

                // Update ref with current save handler
                saveHandlerRef.current = handleSave;

                // Expose save function via ref to avoid dependency issues
                window.saveBeforeClose = () => {
                    if (saveHandlerRef.current) {
                        return saveHandlerRef.current();
                    }
                };
            }, [hasUnsavedChanges]);

            // Auto-save draft every 10 seconds when there are unsaved changes
            useEffect(() => {
                if (!hasUnsavedChanges || isLocked) return;

                const saveDraft = () => {
                    try {
                        const draft = {
                            timestamp: new Date().toISOString(),
                            patientName,
                            cNumber,
                            dateOfBirth,
                            testDate,
                            tests,
                            activeTestId,
                            activeTab,
                            confidenceLevel,
                            currentTestId,
                            clinicalNotes
                        };
                        localStorage.setItem('nu6_draft_recovery', JSON.stringify(draft));
                    } catch (e) {
                        console.error('Failed to save draft:', e);
                    }
                };

                const timer = setInterval(saveDraft, 10000); // Auto-save every 10 seconds
                return () => clearInterval(timer);
            }, [hasUnsavedChanges, patientName, cNumber, dateOfBirth, testDate, tests, activeTestId, activeTab, confidenceLevel, currentTestId, isLocked]);

            // Check for recovery data on mount (after unlock)
            useEffect(() => {
                if (isLocked) return;
                try {
                    const draft = localStorage.getItem('nu6_draft_recovery');
                    if (draft) {
                        const parsed = JSON.parse(draft);
                        // Only offer recovery if draft is less than 24 hours old
                        const draftTime = new Date(parsed.timestamp);
                        const hoursSince = (Date.now() - draftTime.getTime()) / (1000 * 60 * 60);
                        if (hoursSince < 24) {
                            setRecoveryData(parsed);
                            setShowRecoveryModal(true);
                        } else {
                            // Clear old draft
                            localStorage.removeItem('nu6_draft_recovery');
                        }
                    }
                } catch (e) {
                    console.error('Failed to check recovery data:', e);
                }
            }, [isLocked]);

            // Auto-save every 30 seconds
            useEffect(() => {
                if (!autoSaveEnabled || isLocked) return;

                const interval = setInterval(() => {
                    if (hasUnsavedChanges) {
                        handleAutoSave();
                    }
                }, 30000); // 30 seconds

                return () => clearInterval(interval);
            }, [hasUnsavedChanges, autoSaveEnabled, isLocked, patientName, testDate, currentTestId, cNumber, dateOfBirth, tests, activeTestId, activeTab, confidenceLevel]);

            const handleRestoreRecovery = () => {
                if (!recoveryData) return;
                setCurrentTestId(recoveryData.currentTestId);
                // Restore first/last name from recovery if available
                if (recoveryData.firstName !== undefined || recoveryData.lastName !== undefined) {
                    setFirstName(recoveryData.firstName || '');
                    setLastName(recoveryData.lastName || '');
                } else {
                    const parts = (recoveryData.patientName || '').trim().split(/\s+/);
                    setFirstName(parts.shift() || '');
                    setLastName(parts.join(' ') || '');
                }
                setCNumber(recoveryData.cNumber || '');
                setDateOfBirth(recoveryData.dateOfBirth || '');
                setTestDate(recoveryData.testDate || new Date().toISOString().split('T')[0]);
                setTests(recoveryData.tests);
                setActiveTestId(recoveryData.activeTestId || 'A');
                setActiveTab(recoveryData.activeTab || 'scoring');
                setConfidenceLevel(recoveryData.confidenceLevel || 95);
                setClinicalNotes(recoveryData.clinicalNotes || '');
                setHasUnsavedChanges(true); // Mark as unsaved so they can save it
                setShowRecoveryModal(false);
                setRecoveryData(null);
            };

            const handleDiscardRecovery = () => {
                localStorage.removeItem('nu6_draft_recovery');
                setShowRecoveryModal(false);
                setRecoveryData(null);
            };

            // Handle encrypted import with password
            const handleDecryptAndImport = async () => {
                if (!encryptedImportPassword || !encryptedImportFile) {
                    alert('Please enter the password.');
                    return;
                }
                try {
                    const decrypted = await CryptoService.decryptData(encryptedImportFile, encryptedImportPassword);
                    if (!Array.isArray(decrypted)) {
                        alert('Invalid encrypted file format.');
                        return;
                    }
                    // Show import preview
                    setImportPreviewRecords(decrypted);
                    setImportPreviewFileName('Encrypted Import');
                    const invalidCount = decrypted.filter(r => !r || !r.patientName || !r.testDate || !r.tests).length;
                    setImportPreviewInvalidCount(invalidCount);
                    setShowEncryptedImportModal(false);
                    setEncryptedImportPassword('');
                    setEncryptedImportFile(null);
                    setShowImportPreviewModal(true);
                } catch (err) {
                    console.error('Decryption failed:', err);
                    alert('Failed to decrypt file. Wrong password or corrupted file.');
                }
            };

            const handleSaveSettings = async (newSettings) => {
                try {
                    await window.SecureDB.saveSettings(newSettings);
                    setClinicSettings(newSettings);
                    alert("Settings saved successfully.");
                } catch (e) { console.error(e); alert("Failed to save settings."); }
            };

            const handleExportPDF = () => {
                const doc = new window.jspdf.jsPDF();

                // Format Condition Helper
                const formatCondition = (test) => test.deviceModel ? `${test.condition}\n(${test.deviceModel})` : test.condition;

                // Format List ID Helper
                const formatListId = (id) => {
                    if (id === 'HF1') return 'Rose Hill HF 1D';
                    if (id === 'HF2') return 'Rose Hill HF 2D';
                    if (id === 'HF3') return 'Rose Hill HF 3D';
                    if (id === 'HF4') return 'Rose Hill HF 4D';
                    return id;
                };

                // Header (Clinic Info)
                doc.setFontSize(18);
                doc.text("Speech Recognition Report", 105, 20, { align: 'center' });

                doc.setFontSize(12);
                if (clinicSettings) {
                    doc.text(clinicSettings.clinicName || "", 20, 30);
                    doc.setFontSize(10);
                    doc.text(`Audiologist: ${clinicSettings.audiologistName || ""}`, 20, 36);
                    doc.text(`License: ${clinicSettings.licenseNumber || ""}`, 20, 42);
                }

                // Patient Info
                doc.setFontSize(12);
                const reportAge = computeAgeYears(dateOfBirth, testDate);
                doc.text(`Patient: ${patientName}`, 140, 30);
                doc.text(`ID: ${cNumber}`, 140, 36);
                doc.text(`Date: ${testDate}`, 140, 42);
                doc.text(`DOB: ${dateOfBirth || '--'}`, 140, 48);
                doc.text(`Age: ${reportAge !== null && reportAge !== undefined ? reportAge + ' yrs' : '--'}`, 140, 54);
                if (timerElapsed > 0) {
                    doc.text(`Duration: ${formatTimerDisplay(timerElapsed)}`, 140, 60);
                }

                const lineY = timerElapsed > 0 ? 64 : 58;
                doc.line(20, lineY, 190, lineY);

                // Summary Table
                // Determine headers and data based on test type
                const isBkbA = baselineStats.isBKB;
                const isBkbB = comparisonStats.isBKB;

                let headers = [['Test', 'Condition', 'List', 'Level', 'Speech Az', 'SNR', 'Noise Az', 'aTNT', 'TNT Exc Width']];
                // Append score columns based on type
                if (isBkbA || isBkbB) {
                    headers[0].push('SNR-50');
                } else {
                    headers[0].push('Word Score');
                    headers[0].push('Phoneme Score');
                }

                const getRowData = (test, stats, isBkb) => {
                    const baseData = [
                        `Test ${test.id}`,
                        formatCondition(test),
                        formatListId(test.listId),
                        `${test.level || '--'}`,
                        `${test.speechAzimuth || '--'}`,
                        `${test.snr || '--'}`,
                        `${test.noiseAzimuth || '--'}`,
                        `${test.tnt || '--'}`,
                        `${test.tntExcursionWidth || '--'}`
                    ];

                    if (isBkbA || isBkbB) {
                        // If ANY test is BKB, show SNR-50 column
                        // If this specific test is BKB, show its SNR-50, else '--'
                        baseData.push(isBkb ? `${stats.snr50?.toFixed(1)} dB` : '--');
                    } else {
                        // Standard NU-6 display
                        baseData.push(`${stats.wordPercent}%`);
                        baseData.push(`${stats.phonemePercent}%`);
                    }
                    return baseData;
                };

                doc.autoTable({
                    startY: lineY + 4,
                    head: headers,
                    body: [
                        getRowData(baselineTest, baselineStats, isBkbA),
                        getRowData(comparisonTest, comparisonStats, isBkbB)
                    ],
                    theme: 'striped',
                    headStyles: { fillColor: [66, 135, 245] }
                });

                // Significance
                let finalY = doc.lastAutoTable.finalY + 10;
                doc.setFontSize(11);
                doc.text("Statistical Significance:", 20, finalY);
                finalY += 6;
                doc.setFontSize(10);
                doc.text(`Critical Difference Level: ${confidenceLevel}%`, 20, finalY);
                finalY += 5;

                if (isBkbA && isBkbB) {
                    const isSig = isBKBDiffSig ? "YES - Significant Difference" : "NO - Within Critical Limits";
                    doc.text(`SNR-50 Difference: ${isSig}`, 20, finalY);
                } else if (!isBkbA && !isBkbB) {
                    const isSig = isWordDiffSig ? "YES - Significant Difference" : "NO - Within Critical Limits";
                    doc.text(`Word Score Difference: ${isSig}`, 20, finalY);
                }

                // Add Phoneme Significance to PDF if applicable (Only if NOT BKB)
                if (tests.A.scoringMode === 'phoneme' && tests.B.scoringMode === 'phoneme' && !isBkbA && !isBkbB) {
                    finalY += 5;
                    const isPhonSig = isPhonemeDiffSig ? "YES - Significant Difference" : "NO - Within Critical Limits";
                    doc.text(`Phoneme Score Difference: ${isPhonSig}`, 20, finalY);
                }

                // Add TNT Significance if both tests have TNT data
                if (tntDifference !== null) {
                    finalY += 5;
                    const tntSig = isTNTDiffSig ? "YES - Significant Difference" : "NO - Within Critical Limits";
                    const tntCI = confidenceLevel === 95 ? 2.8 : 1.8;
                    doc.text(`aTNT Difference: ${tntDifference.toFixed(2)} dB - ${tntSig} (${confidenceLevel}% CI: >${tntCI} dB)`, 20, finalY);
                }

                // Add TNT Excursion Width Significance if both tests have TNT Excursion Width data
                if (tntExcursionWidthDifference !== null) {
                    finalY += 5;
                    const tntExcSig = isTNTExcursionWidthDiffSig ? "YES - Significant Difference" : "NO - Within Critical Limits";
                    const tntExcCI = confidenceLevel === 95 ? 1.0 : 0.7;
                    doc.text(`TNT Excursion Width Difference: ${tntExcursionWidthDifference.toFixed(2)} dB - ${tntExcSig} (${confidenceLevel}% CI: >${tntExcCI} dB)`, 20, finalY);
                }


                // Add Comparative Ease if applicable
                // Add Comparative Ease if applicable
                if (!isWordDiffSig && !(baselineTest.scoringMode === 'phoneme' && isPhonemeDiffSig)) {
                    finalY += 5;
                    const rawEase = tests.comparativeEase;
                    const displayedEase = reversedComparison ? (10 - rawEase) : rawEase;

                    const ratingText = `Comparative Ease of Listening Rating: ${displayedEase}/10`;
                    doc.text(ratingText, 20, finalY);

                    // Ease delta relative to neutral (5) — moved to next line with label, smaller font
                    const easeDelta = displayedEase - 5;
                    const deltaText = `${easeDelta > 0 ? ('+' + easeDelta) : easeDelta}`;
                    finalY += 5;
                    doc.setFontSize(9);
                    doc.text(`Ease of Listening Delta: ${deltaText}`, 20, finalY);
                    doc.setFontSize(10);

                    finalY += 6;
                    let easeDesc = "No Difference";
                    if (displayedEase > 5) easeDesc = `Test ${comparisonTest.id} is Easier`;
                    if (displayedEase < 5) easeDesc = `Test ${comparisonTest.id} is Harder`;
                    doc.setFontSize(9);
                    doc.text(`(${easeDesc})`, 25, finalY);
                    doc.setFontSize(10);
                }

                // Outcome
                finalY += 10;
                doc.setFontSize(11);
                doc.text(`Outcome (${outcomeMode || 'Demo'}):`, 20, finalY);
                doc.setFontSize(10);
                finalY += 6;

                if (outcomeMode === 'Validation') {
                    doc.text(`${outcome}`, 20, finalY);
                    if (ioiHaScore) {
                        finalY += 6;
                        doc.text(`IOI-HA Score: ${ioiHaScore}`, 20, finalY);
                    }
                } else {
                    if (outcome === 'Sold') {
                        doc.text(`Sold - Type: ${soldType}`, 20, finalY);
                    } else if (outcome === 'Not Sold') {
                        doc.text(`Not Sold - Reason: ${notSoldReason}`, 20, finalY);
                    } else {
                        doc.text(outcome, 20, finalY);
                    }
                }

                // Notes
                finalY += 15;
                doc.text("Clinical Notes:", 20, finalY);
                if (clinicalNotes && clinicalNotes.trim()) {
                    doc.setFontSize(10);
                    const splitNotes = doc.splitTextToSize(clinicalNotes, 170);
                    doc.text(splitNotes, 20, finalY + 6);
                    finalY += (splitNotes.length * 5) + 5;
                } else {
                    doc.rect(20, finalY + 2, 170, 30);
                    finalY += 35;
                }

                // Signature
                finalY += 50;
                doc.line(20, finalY, 80, finalY);
                doc.text("Provider Signature", 20, finalY + 5);

                doc.save(`NU6_Report_${patientName.replace(/\s/g, '_')}_${testDate}.pdf`);
            };

            const getEffortColor = (val) => { if (val <= 4) return 'text-emerald-600'; if (val >= 6) return 'text-red-600'; return 'text-blue-600'; };

            if (!dbReady) {
                if (dbError) {
                    return (
                        <div className="min-h-screen flex flex-col items-center justify-center text-red-600 p-4">
                            <AlertOctagon className="w-12 h-12 mb-4" />
                            <h2 className="text-xl font-bold mb-2">Initialization Error</h2>
                            <p className="text-center mb-4">{dbError}</p>
                            <div className="text-sm text-slate-600 max-w-md text-center">
                                <p className="mb-2">This may happen if:</p>
                                <ul className="list-disc text-left pl-6 mb-4">
                                    <li>You are in a Private/Incognito window</li>
                                    <li>Storage permissions are denied</li>
                                    <li>Another tab is blocking the database update</li>
                                </ul>
                                <button onClick={() => window.location.reload()} className="btn-primary">Reload App</button>
                            </div>
                        </div>
                    );
                }
                return <div className="min-h-screen flex items-center justify-center text-slate-500"><Loader className="w-8 h-8 mr-2" /> Initializing secure storage...</div>;
            }
            if (isLocked) return <LoginModal isSetup={hasPassword} onLogin={() => setIsLocked(false)} />;

            // Determine if we show comparative ease scale
            // Logic: Show if Word Diff is NOT Significant AND (Phoneme Diff is NOT Significant OR not in phoneme mode) AND (BKB Diff is NOT Significant)
            // Determine if we show comparative ease scale
            // Logic: Show if Word Diff is NOT Significant AND (Phoneme Diff is NOT Significant OR not in phoneme mode) AND (BKB Diff is NOT Significant)

            // Explicitly check for BKB test type
            const isBkbTest = baselineStats.isBKB && comparisonStats.isBKB;
            const bkbCondition = isBkbTest ? !isBKBDiffSig : true;

            const showComparativeEase = !isWordDiffSig && !(baselineTest.scoringMode === 'phoneme' && isPhonemeDiffSig) && bkbCondition;



            return (
                <div className="min-h-screen relative z-0 text-slate-900 p-4 md:p-8 print:p-0 overflow-hidden font-sans bg-slate-50/50">
                    <div className="ambient-orb orb-1"></div>
                    <div className="ambient-orb orb-2"></div>
                    <ListeningEffortScaleModal isOpen={showScaleModal} onClose={() => setShowScaleModal(false)} />
                    <CriticalDifferenceModal isOpen={showChartModal} onClose={() => setShowChartModal(false)} confidenceLevel={confidenceLevel} />
                    <PhonemeDisclaimerModal isOpen={showPhonemeModal} onClose={() => setShowPhonemeModal(false)} />
                    <LoadTestModal isOpen={showLoadModal} onClose={() => setShowLoadModal(false)} onLoad={handleLoadTest} />
                    <SettingsModal isOpen={showSettingsModal} onClose={() => setShowSettingsModal(false)} initialSettings={clinicSettings} onSave={handleSaveSettings} />
                    <ComparativeEaseScaleModal isOpen={showComparativeScaleModal} onClose={() => setShowComparativeScaleModal(false)} />
                    <ImportPreviewModal isOpen={showImportPreviewModal} onClose={() => setShowImportPreviewModal(false)} fileName={importPreviewFileName} records={importPreviewRecords} invalidCount={importPreviewInvalidCount} onImportOverwrite={() => importRecords('overwrite')} onImportAppend={() => importRecords('append')} onImportSkip={() => importRecords('skip')} onImportMerge={() => importRecords('merge')} onImportUseSelected={() => importRecords(importModePick)} defaultMode={importModePick} />
                    <RecoveryModal isOpen={showRecoveryModal} data={recoveryData} onRestore={handleRestoreRecovery} onDiscard={handleDiscardRecovery} />

                    {/* Export Options Modal */}
                    {showExportModal && (
                        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                            <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 relative">
                                <button onClick={() => setShowExportModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
                                <h3 className="text-lg font-bold text-slate-800 mb-3">Export Database</h3>
                                <p className="text-sm text-slate-600 mb-2">Choose export format:</p>

                                {/* Date Filter Section */}
                                <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-lg p-3 mb-4 border border-slate-200">
                                    <div className="text-xs font-semibold text-slate-700 mb-2">📅 Filter by Test Date (optional)</div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="text-xs text-slate-600">Start Date</label>
                                            <input
                                                type="date"
                                                value={exportStartDate}
                                                onChange={(e) => setExportStartDate(e.target.value)}
                                                className="w-full px-2 py-1 text-sm border border-slate-300 rounded"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-slate-600">End Date</label>
                                            <input
                                                type="date"
                                                value={exportEndDate}
                                                onChange={(e) => setExportEndDate(e.target.value)}
                                                className="w-full px-2 py-1 text-sm border border-slate-300 rounded"
                                            />
                                        </div>
                                    </div>
                                    {(exportStartDate || exportEndDate) && (
                                        <button
                                            onClick={() => { setExportStartDate(''); setExportEndDate(''); }}
                                            className="text-xs text-blue-600 hover:text-blue-800 mt-2"
                                        >
                                            Clear dates
                                        </button>
                                    )}
                                </div>
                                <div className="space-y-3">
                                    <button onClick={handleExportEncrypted} className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-left transition">
                                        <div className="font-semibold">🔒 Encrypted Export (JSON with PHI)</div>
                                        <div className="text-xs opacity-90 mt-1">AES-256 encrypted, password protected, includes all patient data</div>
                                    </button>
                                    <button onClick={handleExportDeidentified} className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg text-left transition">
                                        <div className="font-semibold">🔓 De-identified Export (JSON - PHI removed)</div>
                                        <div className="text-xs opacity-90 mt-1">Unencrypted, removes patient name & DOB, age 90+ grouped</div>
                                    </button>
                                    <button onClick={() => { handleExportClick('individual'); setShowExportModal(false); }} className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-left transition">
                                        <div className="font-semibold">📊 CSV Export - Individual Tests</div>
                                        <div className="text-xs opacity-90 mt-1">One row per test, includes significance calculations & outcomes</div>
                                    </button>
                                    <button onClick={() => { handleExportClick('aggregate'); setShowExportModal(false); }} className="w-full px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-left transition">
                                        <div className="font-semibold">📈 CSV Export - Aggregate Statistics</div>
                                        <div className="text-xs opacity-90 mt-1">Grouped by list, with mean scores and standard deviations</div>
                                    </button>
                                    <button onClick={() => { handleExportFHIR(); setShowExportModal(false); }} className="w-full px-4 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-left transition flex items-center gap-3">
                                        <FileJson className="w-6 h-6 text-teal-200 shrink-0" />
                                        <div>
                                            <div className="font-semibold">HL7 FHIR Export (JSON)</div>
                                            <div className="text-xs opacity-90 mt-1">Standardized Interoperability format for EHRs</div>
                                        </div>
                                    </button>
                                </div>
                                <button onClick={() => setShowExportModal(false)} className="w-full mt-3 px-4 py-2 bg-slate-100 rounded text-slate-700">Cancel</button>
                            </div>
                        </div>
                    )}

                    {/* New Test Modal: New Patient vs Same Patient */}
                    {showNewTestModal && (
                        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                            <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 relative">
                                <button onClick={() => setShowNewTestModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
                                <h3 className="text-lg font-bold text-slate-800 mb-3">Start New Test</h3>
                                <p className="text-sm text-slate-600 mb-4">Would you like to start a test for a <strong>New Patient</strong> (clear all data) or keep the <strong>Same Patient</strong> (keep name/ID)?</p>
                                <div className="space-y-3">
                                    <button onClick={() => {
                                        if (hasUnsavedChanges && !confirm('You have unsaved changes. Continue without saving?')) return;
                                        resetTestOnly();
                                        setShowNewTestModal(false);
                                    }} className="w-full px-4 py-3 bg-green-50 border border-green-200 hover:bg-green-100 rounded-lg text-green-800 font-semibold flex items-center justify-center gap-2">
                                        <UserCheck className="w-5 h-5" /> Same Patient
                                        <span className="text-xs font-normal opacity-75">(Keep Name/ID)</span>
                                    </button>
                                    <button onClick={() => {
                                        if (hasUnsavedChanges && !confirm('You have unsaved changes. Continue without saving?')) return;
                                        clearAllData();
                                        setShowNewTestModal(false);
                                    }} className="w-full px-4 py-3 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-lg text-blue-800 font-semibold flex items-center justify-center gap-2">
                                        <UserPlus className="w-5 h-5" /> New Patient
                                        <span className="text-xs font-normal opacity-75">(Clear All)</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Encrypted Export Password Modal */}
                    {showExportPasswordModal && (
                        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                            <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 relative">
                                <button onClick={() => setShowExportPasswordModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
                                <h3 className="text-lg font-bold text-slate-800 mb-3">🔒 Set Export Password</h3>
                                <p className="text-sm text-slate-600 mb-4">Set a password to encrypt this file. You will need this password to import the data later.</p>
                                <input
                                    type="password"
                                    value={exportPassword}
                                    onChange={(e) => setExportPassword(e.target.value)}
                                    onKeyPress={(e) => { if (e.key === 'Enter') confirmExportEncrypted(); }}
                                    placeholder="Enter password (min 8 chars)"
                                    className="w-full px-3 py-2 border border-slate-300 rounded mb-4"
                                    autoFocus
                                />
                                <div className="flex gap-2">
                                    <button onClick={confirmExportEncrypted} className="btn-primary">Export Encrypted</button>
                                    <button onClick={() => setShowExportPasswordModal(false)} className="flex-1 px-4 py-2 bg-slate-100 rounded">Cancel</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Encrypted Import Password Modal */}
                    {showEncryptedImportModal && (
                        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                            <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 relative">
                                <button onClick={() => { setShowEncryptedImportModal(false); setEncryptedImportPassword(''); setEncryptedImportFile(null); }} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
                                <h3 className="text-lg font-bold text-slate-800 mb-3">🔒 Encrypted Import</h3>
                                <p className="text-sm text-slate-600 mb-4">This file is encrypted. Enter the password used during export:</p>
                                <input
                                    type="password"
                                    value={encryptedImportPassword}
                                    onChange={(e) => setEncryptedImportPassword(e.target.value)}
                                    onKeyPress={(e) => { if (e.key === 'Enter') handleDecryptAndImport(); }}
                                    placeholder="Enter password"
                                    className="w-full px-3 py-2 border border-slate-300 rounded mb-4"
                                    autoFocus
                                />
                                <div className="flex gap-2">
                                    <button onClick={handleDecryptAndImport} className="btn-primary">Decrypt & Import</button>
                                    <button onClick={() => { setShowEncryptedImportModal(false); setEncryptedImportPassword(''); setEncryptedImportFile(null); }} className="flex-1 px-4 py-2 bg-slate-100 rounded">Cancel</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Delete DB Warning Modal */}
                    {showDeleteDbModal && (
                        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                            <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 relative">
                                <button onClick={() => { setShowDeleteDbModal(false); setDeleteDbConfirmText(''); }} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
                                <h3 className="text-lg font-bold text-slate-800 mb-2">Danger: Delete Local Database</h3>
                                <p className="text-sm text-slate-600 mb-4">This action will permanently delete <strong>all patient records</strong> from the local database. Clinic settings will be preserved. This cannot be undone.</p>
                                <div className="mb-4">
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Type <span className="font-mono">DELETE</span> to confirm</label>
                                    <input type="text" value={deleteDbConfirmText} onChange={(e) => setDeleteDbConfirmText(e.target.value)} placeholder="Type DELETE to confirm" className="w-full px-3 py-2 border border-slate-300 rounded" autoFocus />
                                </div>
                                <div className="flex justify-end gap-2">
                                    <button onClick={() => { setShowDeleteDbModal(false); setDeleteDbConfirmText(''); }} className="px-4 py-2 bg-white border rounded">Cancel</button>
                                    <button onClick={async () => { if (deleteDbConfirmText === 'DELETE') { setShowDeleteDbModal(false); setDeleteDbConfirmText(''); try { await window.SecureDB.deleteAllTests(); alert('Database cleared. Clinic settings preserved.'); resetForm(); setTimeout(() => { if (document.activeElement) document.activeElement.blur(); document.body.focus(); document.body.click(); }, 150); } catch (e) { console.error(e); alert('Failed to delete database.'); } } else { alert('Please type DELETE to confirm.'); } }} className="btn-primary from-red-500 to-rose-600 shadow-red-500/30">Delete Database</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Import Source Modal: choose simulated DB or upload file */}
                    {showImportSourceModal && (
                        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                            <div className="bg-white rounded-xl shadow-lg w-full max-w-sm p-6 relative">
                                <button onClick={() => setShowImportSourceModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
                                <h3 className="text-lg font-bold text-slate-800 mb-3">Import Source</h3>
                                <p className="text-sm text-slate-600 mb-4">Choose a source to import records from.</p>
                                <div className="space-y-3">
                                    <button onClick={handleUseSimulatedDB} className="w-full px-4 py-2 bg-slate-100 rounded text-slate-800">Use Simulated DB (100 records, longitudinal)</button>
                                    <button onClick={handleUseFileUpload} className="w-full px-4 py-2 bg-white border rounded text-slate-800">Upload JSON File</button>
                                </div>
                                <div className="mt-4 text-xs text-slate-500">Tip: choose <strong>Skip duplicates</strong> mode if you are re-importing the same exported file to avoid duplicates, or <strong>Merge duplicates</strong> to combine updated IDs.</div>
                            </div>
                        </div>
                    )}

                    <div className="max-w-6xl mx-auto space-y-8 relative z-10 mt-6">
                        {/* Header Controls */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="glass rounded-3xl p-8 print:hidden shadow-lg border-white/50">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                                <div>
                                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                                        <Calculator className="w-6 h-6 text-blue-600" />
                                        Hearing Aid Demonstration App
                                        <span className="text-sm font-normal text-slate-400">v1.5.1</span>
                                    </h1>
                                    <p className="text-slate-500 text-sm">Comparison Mode & Multi-list Support</p>
                                </div>
                                <div className="flex flex-wrap gap-2 justify-end">
                                    {/* File Menu Dropdown */}
                                    <div className="relative">
                                        <button
                                            onClick={() => setShowFileMenu(!showFileMenu)}
                                            className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition text-sm font-medium"
                                        >
                                            <Database className="w-4 h-4" /> File {showFileMenu ? '▲' : '▼'}
                                        </button>
                                        {showFileMenu && (
                                            <div className="absolute top-full mt-1 left-0 bg-white border border-slate-200 rounded-lg shadow-lg z-50 min-w-[200px]">
                                                <button
                                                    onClick={() => { setShowLoadModal(true); setShowFileMenu(false); }}
                                                    className="w-full text-left px-4 py-2 hover:bg-gradient-to-br from-slate-50 to-blue-50 flex items-center gap-2 text-sm text-slate-700 border-b border-slate-100"
                                                >
                                                    <Database className="w-4 h-4" /> Load Patient
                                                </button>
                                                <button
                                                    onClick={() => { handleImportDB(); setShowFileMenu(false); }}
                                                    className="w-full text-left px-4 py-2 hover:bg-gradient-to-br from-slate-50 to-blue-50 flex items-center gap-2 text-sm text-slate-700 border-b border-slate-100"
                                                >
                                                    <FileUp className="w-4 h-4" /> Import Database
                                                </button>
                                                <button
                                                    onClick={() => { handleExportDB(); setShowFileMenu(false); }}
                                                    className="w-full text-left px-4 py-2 hover:bg-gradient-to-br from-slate-50 to-blue-50 flex items-center gap-2 text-sm text-slate-700 border-b border-slate-100"
                                                >
                                                    <Download className="w-4 h-4" /> Export Database
                                                </button>
                                                <button
                                                    onClick={() => { setShowDeleteDbModal(true); setShowFileMenu(false); }}
                                                    className="w-full text-left px-4 py-2 hover:bg-red-50 flex items-center gap-2 text-sm text-red-700 rounded-b-lg"
                                                >
                                                    <Trash2 className="w-4 h-4" /> Delete Database
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <input type="file" accept=".json,application/json" ref={fileInputRef} style={{ display: 'none' }} onChange={handleImportFile} />

                                    <button onClick={() => setShowSettingsModal(true)} className="flex items-center gap-2 px-3 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition text-sm font-medium"><SettingsIcon className="w-4 h-4" /></button>
                                    <button onClick={handleExportPDF} className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition text-sm font-medium"><FileText className="w-4 h-4" /> PDF Report</button>
                                    <div className="flex flex-col gap-1">
                                        <button onClick={handleSave} className="btn-primary"><Save className="w-4 h-4" /> Save (Local)</button>
                                        {lastSaved && (
                                            <div className="text-[10px] text-slate-400 text-center">
                                                Last saved: {lastSaved.toLocaleTimeString()}
                                            </div>
                                        )}
                                    </div>
                                    {currentTestId && (
                                        <button onClick={handleDeleteCurrentRecord} className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition text-sm font-medium"><Trash2 className="w-4 h-4" /> Delete</button>
                                    )}

                                    {/* New Test - make green */}
                                    <button onClick={() => setShowNewTestModal(true)} className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 hover:bg-green-200 transition text-sm font-medium rounded-lg"><RotateCcw className="w-4 h-4" /> New Test</button>

                                    {/* Timer Controls */}
                                    <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 border border-purple-200 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-purple-600" />
                                            <span className="font-mono text-lg font-bold text-purple-700">{timerDisplay}</span>
                                        </div>
                                        <div className="flex gap-1">
                                            {!timerIsRunning ? (
                                                <button onClick={startTimer} className="p-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded transition" title="Start Timer">
                                                    <Play className="w-3 h-3" />
                                                </button>
                                            ) : (
                                                <button onClick={pauseTimer} className="p-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded transition" title="Pause Timer">
                                                    <Pause className="w-3 h-3" />
                                                </button>
                                            )}
                                            <button onClick={stopTimer} disabled={!timerIsRunning && timerElapsed === 0} className="p-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded transition disabled:opacity-50 disabled:cursor-not-allowed" title="Stop Timer">
                                                <Square className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Patient Info */}
                            <div className="bg-gradient-to-br from-slate-50 to-blue-50 p-6 rounded-xl border border-slate-200 mb-6">
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Patient Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div><label className="block text-xs font-medium text-slate-500 mb-1">First Name</label><input type="text" value={firstName} onChange={(e) => { setFirstName(e.target.value); setHasUnsavedChanges(true); }} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" placeholder="First name..." /></div>
                                    <div><label className="block text-xs font-medium text-slate-500 mb-1">Last Name</label><input type="text" value={lastName} onChange={(e) => { setLastName(e.target.value); setHasUnsavedChanges(true); }} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" placeholder="Last name..." /></div>
                                    <div><label className="block text-xs font-medium text-slate-500 mb-1">ID</label><input type="text" value={cNumber} onChange={(e) => { setCNumber(e.target.value); setHasUnsavedChanges(true); }} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" placeholder="Patient ID" /></div>
                                    <div><label className="block text-xs font-medium text-slate-500 mb-1">Date of Birth</label><input type="date" value={dateOfBirth} onChange={(e) => { setDateOfBirth(e.target.value); setHasUnsavedChanges(true); }} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" /></div>
                                    <div><label className="block text-xs font-medium text-slate-500 mb-1">Age</label><div className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white h-[42px] flex items-center">{ageYears !== null && ageYears !== undefined ? `${ageYears} years` : '—'}</div></div>
                                    <div><label className="block text-xs font-medium text-slate-500 mb-1">Test Date</label><input type="date" value={testDate} onChange={(e) => { setTestDate(e.target.value); setHasUnsavedChanges(true); }} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" /></div>
                                </div>
                                <div className="mt-3 text-xs text-slate-500 flex items-center gap-2"><span className="inline-flex px-2 py-1 rounded bg-blue-100 text-blue-700 text-[11px] font-semibold">Comparison Mode Active</span><span>Age auto-calculates using DOB and Test Date.</span></div>
                            </div>

                            {/* Tabs */}
                            <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg w-fit">
                                <button onClick={() => setActiveTab('scoring')} className={`px-4 py-2 text-sm font-medium rounded-md tab-btn flex items-center gap-2 ${activeTab === 'scoring' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}><CheckCircle2 className="w-4 h-4" /> Scoring Entry</button>
                                <button onClick={() => setActiveTab('comparison')} className={`px-4 py-2 text-sm font-medium rounded-md tab-btn flex items-center gap-2 ${activeTab === 'comparison' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}><BarChart3 className="w-4 h-4" /> Comparison Results</button>
                                <button onClick={() => setActiveTab('history')} className={`px-4 py-2 text-sm font-medium rounded-md tab-btn flex items-center gap-2 ${activeTab === 'history' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}><HistoryIcon className="w-4 h-4" /> Longitudinal History</button>
                            </div>
                        </motion.div>

                        {/* Content */}
                        {activeTab === 'scoring' && (
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="glass rounded-3xl p-8 print:hidden shadow-2xl shadow-indigo-500/10 border border-indigo-100">
                                <div className="grid grid-cols-2 gap-4 print:hidden">
                                    {['A', 'B'].map(id => {
                                        const t = tests[id]; const s = id === 'A' ? statsA : statsB; const isActive = activeTestId === id;
                                        return (
                                            <button key={id} onClick={() => setActiveTestId(id)} className={`relative p-4 rounded-xl border-2 text-left transition-all ${isActive ? 'border-blue-500 bg-blue-50/50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                                                <div className="flex justify-between items-start mb-2"><span className={`px-2 py-0.5 rounded text-xs font-bold ${isActive ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>TEST {id}</span>{isActive && <span className="flex h-3 w-3 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span></span>}</div>
                                                <div className="text-sm font-semibold text-slate-800">{t.condition}</div>
                                                <div className="text-xs text-slate-500 mb-2">{t.listId} {t.section}</div>
                                                <div className="flex gap-3 text-sm"><span className="font-bold text-slate-700">W: {s.wordPercent}%</span>{t.scoringMode === 'phoneme' && <span className="font-bold text-slate-700">P: {s.phonemePercent}%</span>}</div>
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="glass rounded-3xl p-8 print:hidden">
                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                        <div className="lg:col-span-5 space-y-6">
                                            <div><label className="block text-xs font-medium text-slate-500 mb-2">Condition</label><div className="flex rounded-lg overflow-hidden border border-slate-200 mb-3">{(activeTestId === 'A' ? ['Unaided', 'Current Tech'] : ['Current Tech', 'New Tech']).map(c => (<button key={c} onClick={() => updateActiveTest('condition', c)} className={`flex-1 py-2 text-sm font-medium transition ${activeTest.condition === c ? 'bg-indigo-600 text-white' : 'bg-gradient-to-br from-slate-50 to-blue-50 hover:bg-slate-100 text-slate-600'}`}>{c}</button>))}</div>{(activeTest.condition === 'Current Tech' || activeTest.condition === 'New Tech') && (<div><input type="text" value={activeTest.deviceModel || ''} onChange={(e) => updateActiveTest('deviceModel', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" placeholder="Enter Make/Model..." /></div>)}</div>
                                            <div><label className="block text-xs font-medium text-slate-500 mb-2">Stimulus Presentation</label><div className="flex rounded-lg overflow-hidden border border-slate-200"><button onClick={() => activeTestId === 'A' && updateActiveTest('stimulusPresentation', 'MLV')} disabled={activeTestId === 'B'} className={`flex-1 py-2 text-xs font-bold transition ${activeTest.stimulusPresentation === 'MLV' ? 'bg-blue-600 text-white' : 'bg-gradient-to-br from-slate-50 to-blue-50 text-slate-600 hover:bg-slate-100'} ${activeTestId === 'B' ? 'cursor-not-allowed opacity-60' : ''}`}>MLV</button><button onClick={() => activeTestId === 'A' && updateActiveTest('stimulusPresentation', 'Recording')} disabled={activeTestId === 'B'} className={`flex-1 py-2 text-xs font-bold transition ${activeTest.stimulusPresentation === 'Recording' ? 'bg-blue-600 text-white' : 'bg-gradient-to-br from-slate-50 to-blue-50 text-slate-600 hover:bg-slate-100'} ${activeTestId === 'B' ? 'cursor-not-allowed opacity-60' : ''}`}>Recording</button></div>{activeTestId === 'B' && <div className="text-[10px] text-slate-400 mt-1 italic">Locked to match Test A</div>}
                                                {activeTest.stimulusPresentation === 'Recording' && (
                                                    <div className="mt-2 space-y-2">
                                                        <div className="p-4 bg-gradient-to-br from-slate-50 to-blue-50 border border-slate-200 rounded-lg">
                                                            <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2"><SettingsIcon className="w-4 h-4" /> Calibration</h4>

                                                            <div className="flex flex-col gap-3 mb-4">
                                                                <div className="flex bg-slate-100 p-1 rounded-lg w-full max-w-sm">
                                                                    <button
                                                                        onClick={() => { setCalibrationSignalGroup('nu6'); setCalibrationSignal('nu6_tone'); }}
                                                                        className={`flex-1 py-1.5 text-sm font-medium rounded-md transition ${calibrationSignalGroup === 'nu6' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                                                                    >
                                                                        NU-6
                                                                    </button>
                                                                    <button
                                                                        onClick={() => { setCalibrationSignalGroup('rh_hf'); setCalibrationSignal('rh_hf_tone'); }}
                                                                        className={`flex-1 py-1.5 text-sm font-medium rounded-md transition ${calibrationSignalGroup === 'rh_hf' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                                                                    >
                                                                        Rose Hill HF
                                                                    </button>
                                                                    
                                                                </div>

                                                                {calibrationSignalGroup === 'nu6' && (
                                                                    <div className="flex gap-4 text-sm pl-2">
                                                                        <label className="flex items-center gap-2 cursor-pointer">
                                                                            <input
                                                                                type="radio"
                                                                                name="calSignal"
                                                                                value="nu6_tone"
                                                                                checked={calibrationSignal === 'nu6_tone'}
                                                                                onChange={() => setCalibrationSignal('nu6_tone')}
                                                                                className="text-blue-600 focus:ring-blue-500"
                                                                            />
                                                                            <span>1000-Hz Calibration Tone</span>
                                                                        </label>
                                                                    </div>
                                                                )}

                                                                {calibrationSignalGroup === 'rh_hf' && (
                                                                    <div className="flex gap-4 text-sm pl-2">
                                                                        <label className="flex items-center gap-2 cursor-pointer">
                                                                            <input
                                                                                type="radio"
                                                                                name="calSignal"
                                                                                value="rh_hf_tone"
                                                                                checked={calibrationSignal === 'rh_hf_tone'}
                                                                                onChange={() => setCalibrationSignal('rh_hf_tone')}
                                                                                className="text-blue-600 focus:ring-blue-500"
                                                                            />
                                                                            <span>1000-Hz Calibration Tone</span>
                                                                        </label>
                                                                        <label className="flex items-center gap-2 cursor-pointer">
                                                                            <input
                                                                                type="radio"
                                                                                name="calSignal"
                                                                                value="rh_hf_ssn"
                                                                                checked={calibrationSignal === 'rh_hf_ssn'}
                                                                                onChange={() => setCalibrationSignal('rh_hf_ssn')}
                                                                                className="text-blue-600 focus:ring-blue-500"
                                                                            />
                                                                            <span>Speech Shaped Noise</span>
                                                                        </label>
                                                                        <label className="flex items-center gap-2 cursor-pointer">
                                                                            <input
                                                                                type="radio"
                                                                                name="calSignal"
                                                                                value="rh_hf_noise"
                                                                                checked={calibrationSignal === 'rh_hf_noise'}
                                                                                onChange={() => setCalibrationSignal('rh_hf_noise')}
                                                                                className="text-blue-600 focus:ring-blue-500"
                                                                            />
                                                                            <span>RH HF Pink Noise</span>
                                                                        </label>
                                                                    </div>
                                                                )}

                                                                {calibrationSignalGroup === 'bkb' && (
                                                                    <div className="flex gap-4 text-sm pl-2">
                                                                        <label className="flex items-center gap-2 cursor-pointer">
                                                                            <input
                                                                                type="radio"
                                                                                name="calSignal"
                                                                                value="bkb_noise"
                                                                                checked={calibrationSignal === 'bkb_noise'}
                                                                                onChange={() => setCalibrationSignal('bkb_noise')}
                                                                                className="text-blue-600 focus:ring-blue-500"
                                                                            />
                                                                            <span>Track 21 Speech Spectrum Noise</span>
                                                                        </label>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <div className="grid grid-cols-2 gap-3">
                                                                <button
                                                                    onClick={() => toggleCalibration('left')}
                                                                    className={`py-2 px-3 rounded text-sm font-bold border transition flex items-center justify-center gap-2 ${calibrationMode === 'left' ? 'bg-red-600 text-white border-red-700 animate-pulse shadow-lg' : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-300'}`}
                                                                >
                                                                    {calibrationMode === 'left' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                                                    Calibrate L
                                                                </button>
                                                                <button
                                                                    onClick={() => toggleCalibration('right')}
                                                                    className={`py-2 px-3 rounded text-sm font-bold border transition flex items-center justify-center gap-2 ${calibrationMode === 'right' ? 'bg-blue-600 text-white border-blue-700 animate-pulse shadow-lg' : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-300'}`}
                                                                >
                                                                    {calibrationMode === 'right' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                                                    Calibrate R
                                                                </button>
                                                            </div>
                                                            <p className="text-xs text-slate-400 mt-2 text-center">
                                                                {calibrationMode !== 'none' ? 'Playing calibration signal...' : 'Click to start/stop calibration tone'}
                                                            </p>
                                                        </div>

                                                        {(['HF1', 'HF2', 'HF3', 'HF4', '3A'].includes(activeTest.listId)) && (
                                                            <div className="space-y-2">
                                                                <button onClick={toggleNoise} className={`w-full py-2 text-xs font-bold rounded flex items-center justify-center gap-2 transition ${isPlayingNoise ? 'bg-orange-100 text-orange-700 border border-orange-300 animate-pulse' : 'bg-gradient-to-br from-slate-50 to-blue-50 text-slate-600 hover:bg-slate-100 border border-slate-200'}`}>
                                                                    {isPlayingNoise ? <Square className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
                                                                    {isPlayingNoise ? 'Stop Noise' : 'Background Noise'}
                                                                </button>
                                                                {isPlayingNoise && (
                                                                    <div className="bg-gradient-to-br from-slate-50 to-blue-50 p-2 rounded border border-slate-200">
                                                                        <label className="block text-[10px] font-bold text-slate-500 mb-1 flex justify-between">
                                                                            <span>SNR</span>
                                                                            <span>{snrLevel > 0 ? '+' : ''}{snrLevel} dB</span>
                                                                        </label>
                                                                        <input
                                                                            type="range"
                                                                            min="-5"
                                                                            max="25"
                                                                            step="1"
                                                                            value={snrLevel}
                                                                            onChange={handleSNRChange}
                                                                            className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                                                        />
                                                                        <div className="flex justify-between text-[9px] text-slate-400 mt-1">
                                                                            <span>-5 dB (Loudest)</span>
                                                                            <span>+25 dB (Quietest)</span>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                <button onClick={() => setSpeechToBoth(!speechToBoth)} className={`w-full py-1.5 text-[10px] font-bold border border-slate-300 rounded hover:bg-slate-200 flex items-center justify-center gap-1 mb-1 transition ${speechToBoth ? 'bg-indigo-100 text-indigo-700 border-indigo-300' : 'bg-slate-100 text-slate-600'}`}>
                                                                    <ArrowRightLeft className="w-3 h-3" />
                                                                    {speechToBoth ? 'Speech: L+R (Both)' : 'Speech: Single Channel'}
                                                                </button>
                                                                <button onClick={() => setChannelSwap(!channelSwap)} className="w-full py-1.5 text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-300 rounded hover:bg-slate-200 flex items-center justify-center gap-1">
                                                                    <ArrowRightLeft className="w-3 h-3" />
                                                                    {channelSwap ? 'Speech: R | Noise: L' : 'Speech: L | Noise: R'}
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            {!activeStats.isBKB && (
                                                <div><label className="block text-xs font-medium text-slate-500 mb-2">Scoring Mode</label><div className="flex rounded-lg overflow-hidden border border-slate-200"><button onClick={() => updateActiveTest('scoringMode', 'phoneme')} className={`flex-1 py-2 text-xs font-bold flex items-center justify-center gap-1 transition ${activeTest.scoringMode === 'phoneme' ? 'bg-slate-700 text-white' : 'bg-gradient-to-br from-slate-50 to-blue-50 text-slate-600 hover:bg-slate-100'}`}><ListChecks className="w-3 h-3" /> Phoneme</button><button onClick={() => updateActiveTest('scoringMode', 'word')} className={`flex-1 py-2 text-xs font-bold flex items-center justify-center gap-1 transition ${activeTest.scoringMode === 'word' ? 'bg-slate-700 text-white' : 'bg-gradient-to-br from-slate-50 to-blue-50 text-slate-600 hover:bg-slate-100'}`}><WholeWord className="w-3 h-3" /> Word</button></div></div>
                                            )}
                                        </div>
                                        <div className="lg:col-span-7 grid grid-cols-2 gap-4">
                                            <div><label className="block text-xs font-medium text-slate-500 mb-1">Word List</label><select value={activeTest.listId} onChange={(e) => updateActiveTest('listId', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"><option value="1A">NU-6 List 1A</option><option value="2A">NU-6 List 2A</option><option value="3A">NU-6 List 3A</option><option value="4A">NU-6 List 4A</option><option value="HF1">Rose Hill HF 1D</option><option value="HF2">Rose Hill HF 2D</option><option value="HF3">Rose Hill HF 3D</option><option value="HF4">Rose Hill HF 4D</option><option value="BKB1">BKB-SIN List Pair 1</option><option value="BKB2">BKB-SIN List Pair 2</option><option value="BKB3">BKB-SIN List Pair 3</option><option value="BKB4">BKB-SIN List Pair 4</option><option value="BKB5">BKB-SIN List Pair 5</option><option value="BKB6">BKB-SIN List Pair 6</option><option value="BKB7">BKB-SIN List Pair 7</option><option value="BKB8">BKB-SIN List Pair 8</option><option value="BKB9">BKB-SIN List Pair 9</option><option value="BKB10">BKB-SIN List Pair 10</option></select></div>
                                            <div><label className="block text-xs font-medium text-slate-500 mb-1">Section</label><select value={activeTest.section} onChange={(e) => updateActiveTest('section', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm">{getSectionOptions(activeTestId).map(opt => (<option key={opt.val} value={opt.val}>{opt.label}</option>))}</select></div>
                                            <div><label className="block text-xs font-medium text-slate-500 mb-1">Level (e.g., MLV-avg or 65 dBC)</label><input type="text" value={activeTest.level} onChange={(e) => updateActiveTest('level', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" /></div>
                                            <div><label className="block text-xs font-medium text-slate-500 mb-1">Speech Azimuth</label><input type="text" value={activeTest.speechAzimuth || ''} onChange={(e) => updateActiveTest('speechAzimuth', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" placeholder="e.g., 0°" /></div>
                                            <div><label className="block text-xs font-medium text-slate-500 mb-1">Noise (e.g., +10 dB SNR or 55 dBC)</label><input type="text" value={activeTest.snr} onChange={(e) => updateActiveTest('snr', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" /></div>
                                            <div><label className="block text-xs font-medium text-slate-500 mb-1">Noise Azimuth</label><input type="text" value={activeTest.noiseAzimuth || ''} onChange={(e) => updateActiveTest('noiseAzimuth', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" placeholder="e.g., 180°" /></div>
                                            {(activeTest.condition === 'Current Tech' || activeTest.condition === 'New Tech') && (<div><label className="block text-xs font-medium text-slate-500 mb-1">aTNT (Tracking Noise Tolerance)</label><input type="text" value={activeTest.tnt || ''} onChange={(e) => updateActiveTest('tnt', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" placeholder="e.g., 5 dB" /></div>)}
                                            {(activeTest.condition === 'Current Tech' || activeTest.condition === 'New Tech') && (<div><label className="block text-xs font-medium text-slate-500 mb-1">TNT Excursion Width</label><input type="text" value={activeTest.tntExcursionWidth || ''} onChange={(e) => updateActiveTest('tntExcursionWidth', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" placeholder="e.g., 3 dB" /></div>)}
                                        </div>
                                    </div>
                                </div>
                                {activeStats.isBKB ? (
                                    <BKBSINScoringPanel
                                        stats={activeStats}
                                        scores={activeTest.scores}
                                        testId={activeTestId}
                                        updateScore={setBKBScore}
                                        playTrack={() => playAudio(activeTest.listId, 0, '')}
                                        audioState={audioState}
                                        onPause={pauseAudio}
                                        onResume={resumeAudio}
                                        onStop={stopAudio}
                                    />
                                ) : (
                                    <div className="glass rounded-2xl overflow-hidden print:shadow-none print:border-2 print:border-black">
                                        <div className="bg-gradient-to-br from-slate-50 to-blue-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center print:bg-slate-200">
                                            <div className="font-bold text-slate-700 flex items-center gap-2">Scoring: Test {activeTestId} <span className="font-normal text-slate-500 mx-1">|</span> {activeTest.listId} {activeTest.section}{activeTest.limitTo10 && <span className="ml-2 px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full border border-orange-200 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Limited to 10 Words</span>}</div>
                                            <div className="flex gap-2 print:hidden"><button onClick={() => markAll(true)} className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200 font-medium">Mark All</button></div>
                                        </div>
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-gradient-to-br from-slate-50 to-blue-50 border-b border-slate-200 text-xs uppercase text-slate-500 print:hidden"><tr><th className="px-4 py-2 w-10">#</th>{(activeTest.stimulusPresentation === 'Recording' && ['HF1', 'HF2', 'HF3', 'HF4', '1A', '2A', '3A', '4A'].includes(activeTest.listId)) && <th className="px-2 py-2 w-10">Play</th>}<th className="px-4 py-2">Word</th>{activeTest.scoringMode === 'phoneme' && (<React.Fragment><th className="px-2 py-2 text-center">I</th><th className="px-2 py-2 text-center">M</th><th className="px-2 py-2 text-center">F</th></React.Fragment>)}<th className="px-4 py-2 text-center">{activeTest.scoringMode === 'phoneme' ? 'Word' : 'Result'}</th></tr></thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {activeStats.visibleWords.map((word) => {
                                                    const listId = activeTest.listId; const phonemeScores = word.p.map((p, idx) => { if (p === '-') return null; return activeTest.scores[`${listId}_${word.i}_${idx}`]; }).filter(val => val !== null); const isWordCorrect = phonemeScores.every(s => s === true); const isWordFullyIncorrect = phonemeScores.every(s => s === false);
                                                    const showAudio = activeTest.stimulusPresentation === 'Recording' && ['HF1', 'HF2', 'HF3', 'HF4', '1A', '2A', '3A', '4A'].includes(listId);
                                                    return (
                                                        <tr key={word.i} className="hover:bg-gradient-to-br from-slate-50 to-blue-50"><td className="px-4 py-2 text-slate-400 font-mono text-xs">{word.i}</td>
                                                            {showAudio && (
                                                                <td className="px-2 py-2">
                                                                    <button onClick={() => playAudio(listId, word.i, word.w)} className="p-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 border border-blue-200 transition-colors" title="Play Audio">
                                                                        <Play className="w-3 h-3 fill-current" />
                                                                    </button>
                                                                </td>
                                                            )}
                                                            <td className="px-4 py-2 font-bold text-slate-800">{word.w}</td>
                                                            {activeTest.scoringMode === 'phoneme' ? (<React.Fragment>{word.p.map((phoneme, pIndex) => { const phonemeScore = activeTest.scores[`${listId}_${word.i}_${pIndex}`]; const isCorrect = phonemeScore === true; const isIncorrect = phonemeScore === false; const isPlaceholder = phoneme === '-'; return (<td key={pIndex} className="px-1 py-1 text-center">{!isPlaceholder ? (<button onClick={() => togglePhoneme(word.i, pIndex)} className={`w-10 h-8 rounded flex items-center justify-center font-medium text-base border transition-colors ${isCorrect ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 print:border-none print:text-black print:font-bold' : isIncorrect ? 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100 print:border-none print:text-black print:font-normal' : 'bg-white border-slate-200 text-slate-400 hover:border-red-300 hover:text-red-500 hover:bg-red-50'}`}><span className="ipa-text">{phoneme}</span></button>) : <span className="text-slate-300">—</span>}</td>); })}<td className="px-4 py-2 text-center print:hidden"><div className="flex items-center justify-center gap-2"><button onClick={() => toggleWordCorrect(word.i)} title={isWordCorrect ? "Clear Word" : "Mark Whole Word Correct"} className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors ${isWordCorrect ? 'bg-emerald-100 border-emerald-300 text-emerald-700' : 'bg-gradient-to-br from-slate-50 to-blue-50 border-slate-200 text-slate-400 hover:bg-emerald-50 hover:text-emerald-500 hover:border-emerald-200'}`}><Check className="w-4 h-4" /></button><button onClick={() => setWordScore(word.i, false)} title={isWordFullyIncorrect ? "Clear Word" : "Mark Whole Word Incorrect"} className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors ${isWordFullyIncorrect ? 'bg-red-100 border-red-300 text-red-700' : 'bg-gradient-to-br from-slate-50 to-blue-50 border-slate-200 text-slate-400 hover:bg-red-50 hover:text-red-500 hover:border-red-200'}`}><X className="w-4 h-4" /></button></div></td></React.Fragment>) : (<td className="px-4 py-2 text-center"><div className="flex gap-2 justify-center"><button onClick={() => setWordScore(word.i, true)} className={`flex-1 max-w-[80px] py-1.5 rounded-md font-bold text-xs border transition-colors flex items-center justify-center gap-1 ${isWordCorrect ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm' : 'bg-white border-slate-200 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600'}`}><Check className="w-3 h-3" /> Correct</button><button onClick={() => setWordScore(word.i, false)} className={`flex-1 max-w-[80px] py-1.5 rounded-md font-bold text-xs border transition-colors flex items-center justify-center gap-1 ${isWordFullyIncorrect ? 'bg-red-600 text-white border-red-700 shadow-sm' : 'bg-white border-slate-200 text-slate-400 hover:bg-red-50 hover:text-red-600'}`}><X className="w-3 h-3" /> Incorrect</button></div></td>)}
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                            </motion.div>
                        )}

                        {activeTab === 'comparison' && (
                            <div className="space-y-6">
                                <div className="glass rounded-2xl overflow-hidden print:shadow-none print:border-2 print:border-black">
                                    <div className="bg-slate-800 text-white px-6 py-4 flex items-center justify-between print:bg-black print:text-white">
                                        <h2 className="text-lg font-bold flex items-center gap-2"><BarChart3 className="w-5 h-5" /> Score Comparison</h2>
                                        <div className="text-right"><div className="text-xs opacity-75 font-mono">{testDate} • {patientName} • #{cNumber}</div><div className="hidden">Thornton & Raffin (1978) Model</div></div>
                                    </div>
                                    <div className="p-6">
                                        <div className="flex justify-end mb-4 print:hidden"><div className="bg-slate-100 p-1 rounded-lg flex items-center gap-2 text-sm"><span className="px-2 text-xs font-semibold text-slate-500 uppercase">Critical Difference Level</span><button onClick={() => setConfidenceLevel(95)} className={`px-3 py-1 rounded-md transition ${confidenceLevel === 95 ? 'bg-white shadow text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-200'}`}>95%</button><button onClick={() => setConfidenceLevel(80)} className={`px-3 py-1 rounded-md transition ${confidenceLevel === 80 ? 'bg-white shadow text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-200'}`}>80%</button><button onClick={() => setShowChartModal(true)} className="px-3 py-1 bg-white hover:bg-slate-200 text-slate-600 rounded-md transition border border-slate-200 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> View Tables</button></div></div>
                                        <div className="grid grid-cols-3 gap-8 mb-8">
                                            <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-lg p-4 border border-slate-200 print:bg-white print:border-black"><div className="text-xs font-bold text-slate-500 uppercase mb-1">Test {baselineTest.id} (Baseline)</div><div className="text-lg font-bold text-slate-900 mb-2">{baselineTest.condition}</div><div className="text-sm text-slate-600 mb-4 space-y-1"><div>List: {baselineTest.listId}</div><div>Level: {baselineTest.level || '--'}</div><div>Noise: {baselineTest.snr || '--'}</div>{baselineTest.tnt && <div>aTNT: {baselineTest.tnt}</div>}{baselineTest.tntExcursionWidth && <div>TNT Excursion Width: {baselineTest.tntExcursionWidth}</div>}</div><div className="space-y-2 border-t border-slate-200 pt-3">{baselineStats.isBKB ? <div className="flex justify-between items-center"><span className="text-sm text-slate-600">SNR-50</span><span className="text-xl font-bold text-blue-600">{baselineStats.snr50?.toFixed(1)} dB</span></div> : <><div className="flex justify-between items-center"><span className="text-sm text-slate-600">Word Score</span><span className="text-xl font-bold text-blue-600">{baselineStats.wordPercent}%</span></div>{baselineTest.scoringMode === 'phoneme' && (<div className="flex justify-between items-center"><span className="text-sm text-slate-600">Phoneme Score</span><span className="text-lg font-semibold text-slate-700">{baselineStats.phonemePercent}%</span></div>)}</>}</div></div>

                                            <div className="flex flex-col items-center justify-center text-center">
                                                {/* Word recognition difference - label above, styled like Ease label */}
                                                {!baselineStats.isBKB && !comparisonStats.isBKB && (
                                                    <>
                                                        <div className="text-sm font-bold text-slate-500">Word Recognition Difference</div>
                                                        <div className={`text-3xl font-bold mb-1 ${comparisonStats.wordPercent - baselineStats.wordPercent >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{comparisonStats.wordPercent - baselineStats.wordPercent > 0 ? '+' : ''}{comparisonStats.wordPercent - baselineStats.wordPercent}%</div>
                                                    </>
                                                )}

                                                {(baselineTest.scoringMode === 'phoneme' && comparisonTest.scoringMode === 'phoneme' && !baselineStats.isBKB) && (
                                                    <React.Fragment>
                                                        {/* Phoneme recognition difference - label above, styled like Ease label */}
                                                        <div className="text-sm font-bold text-slate-500 mt-4">Phoneme Recognition Difference</div>
                                                        <div className={`text-3xl font-bold mt-1 ${comparisonStats.phonemePercent - baselineStats.phonemePercent >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{comparisonStats.phonemePercent - baselineStats.phonemePercent > 0 ? '+' : ''}{comparisonStats.phonemePercent - baselineStats.phonemePercent}%</div>
                                                    </React.Fragment>
                                                )}

                                                {(baselineStats.isBKB && comparisonStats.isBKB) && (
                                                    <div className="mt-4">
                                                        <div className="text-sm font-bold text-slate-500">SNR-50 Difference</div>
                                                        <div className={`text-3xl font-bold mt-1 ${bkbDifference >= bkbCriticalDiff ? 'text-emerald-600' : 'text-slate-600'}`}>
                                                            {bkbDifference.toFixed(1)} dB
                                                        </div>
                                                        <div className={`text-xs font-bold uppercase mt-1 px-2 py-0.5 rounded-full inline-block ${isBKBDiffSig ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                                            {isBKBDiffSig ? 'Significant' : 'Not Significant'}
                                                        </div>
                                                        <div className="text-[10px] text-slate-400 mt-1">
                                                            Critical Diff: {bkbCriticalDiff} dB ({confidenceLevel}%)
                                                        </div>
                                                    </div>
                                                )}

                                                {showComparativeEase && (
                                                    <div className="mt-2 text-center">
                                                        <div className="text-sm font-bold text-slate-500">Ease of Listening Delta</div>
                                                        <div className={`text-3xl font-bold mt-1 ${(tests.comparativeEase - 5) >= 2 ? 'text-emerald-600' : (tests.comparativeEase - 5) <= -2 ? 'text-red-600' : 'text-slate-600'}`} aria-live="polite">{(tests.comparativeEase - 5) >= 0 ? '+' : ''}{tests.comparativeEase - 5}</div>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-lg p-4 border border-slate-200 print:bg-white print:border-black"><div className="text-xs font-bold text-slate-500 uppercase mb-1">Test {comparisonTest.id} (Comparison)</div><div className="text-lg font-bold text-slate-900 mb-2">{comparisonTest.condition}</div><div className="text-sm text-slate-600 mb-4 space-y-1"><div>List: {comparisonTest.listId}</div><div>Level: {comparisonTest.level || '--'}</div><div>Noise: {comparisonTest.snr || '--'}</div>{comparisonTest.tnt && <div>aTNT: {comparisonTest.tnt}</div>}{comparisonTest.tntExcursionWidth && <div>TNT Excursion Width: {comparisonTest.tntExcursionWidth}</div>}</div><div className="space-y-2 border-t border-slate-200 pt-3">{comparisonStats.isBKB ? <div className="flex justify-between items-center"><span className="text-sm text-slate-600">SNR-50</span><span className="text-xl font-bold text-blue-600">{comparisonStats.snr50?.toFixed(1)} dB</span></div> : <><div className="flex justify-between items-center"><span className="text-sm text-slate-600">Word Score</span><span className="text-xl font-bold text-blue-600">{comparisonStats.wordPercent}%</span></div>{comparisonTest.scoringMode === 'phoneme' && (<div className="flex justify-between items-center"><span className="text-sm text-slate-600">Phoneme Score</span><span className="text-lg font-semibold text-slate-700">{comparisonStats.phonemePercent}%</span></div>)}</>}</div></div>
                                        </div>

                                        {/* Comparative Ease Slider */}
                                        {showComparativeEase && (
                                            <div className="mb-6 p-4 bg-gradient-to-br from-slate-50 to-blue-50 rounded-lg border border-slate-200">
                                                <div className="flex justify-between items-center mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <label className="text-sm font-bold text-slate-700">Comparative Ease of Listening</label>
                                                        <button onClick={() => setShowComparativeScaleModal(true)} className="text-[10px] text-blue-600 hover:underline flex items-center gap-1">
                                                            <HelpCircle className="w-3 h-3" /> View Scale
                                                        </button>
                                                    </div>
                                                    <span className="text-xs text-slate-500 italic">Rate how much easier/harder Condition {comparisonTest.id} is compared to {baselineTest.id}</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xs font-bold text-slate-500 uppercase">Harder</span>
                                                    <div className="flex-1 relative">
                                                        <input
                                                            type="range"
                                                            min="0"
                                                            max="10"
                                                            value={tests.comparativeEase}
                                                            onChange={(e) => updateComparativeEase(parseInt(e.target.value))}
                                                            className="w-full h-2 bg-gradient-to-r from-red-300 via-slate-300 to-emerald-300 rounded-lg appearance-none cursor-pointer"
                                                        />
                                                        <div className="flex justify-between text-[10px] text-slate-400 mt-1 px-1">
                                                            <span>0</span>
                                                            <span>5 (No Diff)</span>
                                                            <span>10</span>
                                                        </div>
                                                    </div>
                                                    <span className="text-xs font-bold text-slate-500 uppercase">Easier</span>
                                                    <span className={`font-bold text-lg w-8 text-center ${tests.comparativeEase > 5 ? 'text-emerald-600' : tests.comparativeEase < 5 ? 'text-red-600' : 'text-slate-600'}`}>{tests.comparativeEase}</span>
                                                </div>
                                            </div>
                                        )}

                                        <div className="border border-slate-200 rounded-lg overflow-hidden mb-6"><table className="w-full text-sm"><thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200"><tr><th className="px-4 py-2 text-left">Metric (N)</th><th className="px-4 py-2 text-center w-24">Test {baselineTest.id}</th><th className="px-4 py-2 text-center w-32 bg-gradient-to-br from-slate-50 to-blue-50">Critical Range <span className="text-[10px] text-slate-400 block font-normal">({confidenceLevel}%)</span></th><th className="px-4 py-2 text-center w-24">Test {comparisonTest.id}</th><th className="px-4 py-2 text-center w-32">Significant?</th></tr></thead><tbody className="divide-y divide-slate-100">
                                            {(baselineStats.isBKB && comparisonStats.isBKB) ? (
                                                <tr><td className="px-4 py-3 font-medium text-slate-800">SNR-50 <span className="block text-xs text-slate-400 font-normal">Signal-to-Noise Ratio50</span></td><td className="px-4 py-3 text-center text-slate-700 font-bold">{baselineStats.snr50?.toFixed(1)} dB</td><td className="px-4 py-3 text-center text-slate-500 bg-gradient-to-br from-slate-50 to-blue-50 text-xs font-mono">Diff &gt; {bkbCriticalDiff} dB</td><td className="px-4 py-3 text-center text-slate-700 font-bold">{comparisonStats.snr50?.toFixed(1)} dB</td><td className="px-4 py-3 text-center">{isBKBDiffSig ? <span className="inline-flex items-center gap-1 text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded text-xs"><Check className="w-3 h-3" /> Yes</span> : <span className="inline-flex items-center gap-1 text-red-600 font-bold bg-red-50 px-2 py-1 rounded text-xs"><X className="w-3 h-3" /> No</span>}</td></tr>
                                            ) : (
                                                <>
                                                    <tr><td className="px-4 py-3 font-medium text-slate-800">Word Score <span className="block text-xs text-slate-400 font-normal">N = {baselineStats.totalWords}</span></td><td className="px-4 py-3 text-center text-slate-700 font-bold">{baselineStats.wordPercent}%</td><td className="px-4 py-3 text-center text-slate-500 bg-gradient-to-br from-slate-50 to-blue-50 text-xs font-mono">{wordCriticalLimits.lower}% - {wordCriticalLimits.upper}%</td><td className="px-4 py-3 text-center text-slate-700 font-bold">{comparisonStats.wordPercent}%</td><td className="px-4 py-3 text-center">{isWordDiffSig ? <span className="inline-flex items-center gap-1 text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded text-xs"><Check className="w-3 h-3" /> Yes</span> : <span className="inline-flex items-center gap-1 text-red-600 font-bold bg-red-50 px-2 py-1 rounded text-xs"><X className="w-3 h-3" /> No</span>}</td></tr>{(baselineTest.scoringMode === 'phoneme' && comparisonTest.scoringMode === 'phoneme') && (<tr><td className="px-4 py-3 font-medium text-slate-800">Phoneme Score <span className="block text-xs text-slate-400 font-normal">N = {baselineStats.totalPhonemes}</span></td><td className="px-4 py-3 text-center text-slate-700 font-bold">{baselineStats.phonemePercent}%</td><td className="px-4 py-3 text-center text-slate-500 bg-gradient-to-br from-slate-50 to-blue-50 text-xs font-mono">{Number(phonemeCriticalLimits.lower).toFixed(1)}% - {Number(phonemeCriticalLimits.upper).toFixed(1)}%</td><td className="px-4 py-3 text-center text-slate-700 font-bold">{comparisonStats.phonemePercent}%</td><td className="px-4 py-3 text-center">{isPhonemeDiffSig ? <span className="inline-flex items-center gap-1 text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded text-xs"><Check className="w-3 h-3" /> Yes</span> : <span className="inline-flex items-center gap-1 text-red-600 font-bold bg-red-50 px-2 py-1 rounded text-xs"><X className="w-3 h-3" /> No</span>}</td></tr>)}
                                                </>
                                            )}
                                            {tntExcursionWidthDifference !== null && (<tr><td className="px-4 py-3 font-medium text-slate-800">TNT Excursion Width <span className="block text-xs text-slate-400 font-normal">{confidenceLevel}% CI: {'>'} {confidenceLevel === 95 ? 1.0 : 0.7} dB</span></td><td className="px-4 py-3 text-center text-slate-700 font-bold">{baselineTest.tntExcursionWidth || '--'}</td><td className="px-4 py-3 text-center text-slate-500 bg-gradient-to-br from-slate-50 to-blue-50 text-xs font-mono">±{confidenceLevel === 95 ? 1.0 : 0.7} dB</td><td className="px-4 py-3 text-center text-slate-700 font-bold">{comparisonTest.tntExcursionWidth || '--'}</td><td className="px-4 py-3 text-center">{isTNTExcursionWidthDiffSig ? <span className="inline-flex items-center gap-1 text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded text-xs"><Check className="w-3 h-3" /> Yes</span> : <span className="inline-flex items-center gap-1 text-red-600 font-bold bg-red-50 px-2 py-1 rounded text-xs"><X className="w-3 h-3" /> No</span>}</td></tr>)}</tbody></table></div>

                                        {/* Visual Critical Range Comparison */}
                                        <div className="bg-gradient-to-br from-slate-50 to-blue-50 border border-slate-200 rounded-lg p-6 mb-6">
                                            <h4 className="text-sm font-bold text-slate-700 mb-4">Visual Critical Range Comparison</h4>

                                            {/* Word Score Visualization */}
                                            <div className="mb-6">
                                                <div className="text-xs font-semibold text-slate-600 mb-2">Word Score Range</div>
                                                <div className="relative h-20 bg-white border border-slate-300 rounded-lg px-3">
                                                    {/* Scale markers */}
                                                    <div className="absolute inset-x-0 top-1 flex justify-between px-3 text-[10px] text-slate-400">
                                                        <span>0%</span>
                                                        <span>25%</span>
                                                        <span>50%</span>
                                                        <span>75%</span>
                                                        <span>100%</span>
                                                    </div>

                                                    {/* Critical range bar */}
                                                    <div
                                                        className="absolute top-9 h-6 bg-blue-100 border-l-2 border-r-2 border-blue-400"
                                                        style={{
                                                            left: `${wordCriticalLimits.lower}%`,
                                                            width: `${wordCriticalLimits.upper - wordCriticalLimits.lower}%`
                                                        }}
                                                    >
                                                    </div>

                                                    {/* Baseline marker */}
                                                    <div
                                                        className="absolute top-8 w-1.5 h-8 bg-purple-600 z-10 shadow-lg"
                                                        style={{ left: `calc(${baselineStats.wordPercent}% - 3px)` }}
                                                        title={`Test ${baselineTest.id}: ${baselineStats.wordPercent}%`}
                                                    >
                                                        <div className="absolute top-9 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-bold text-purple-600">
                                                            {baselineTest.id}: {baselineStats.wordPercent}%
                                                        </div>
                                                    </div>

                                                    {/* Comparison marker */}
                                                    <div
                                                        className={`absolute top-8 w-1.5 h-8 z-10 shadow-lg ${isWordDiffSig ? 'bg-emerald-600' : 'bg-orange-500'}`}
                                                        style={{ left: `calc(${comparisonStats.wordPercent}% - 3px)` }}
                                                        title={`Test ${comparisonTest.id}: ${comparisonStats.wordPercent}%`}
                                                    >
                                                        <div className={`absolute top-9 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-bold ${isWordDiffSig ? 'text-emerald-600' : 'text-orange-600'}`}>
                                                            {comparisonTest.id}: {comparisonStats.wordPercent}%
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="mt-2 text-xs text-slate-500 flex items-center gap-3">
                                                    <span className="flex items-center gap-1"><span className="w-3 h-3 bg-purple-600 rounded-sm"></span> Test {baselineTest.id}</span>
                                                    <span className="flex items-center gap-1"><span className={`w-3 h-3 rounded-sm ${isWordDiffSig ? 'bg-emerald-600' : 'bg-orange-500'}`}></span> Test {comparisonTest.id} {isWordDiffSig ? '(Significant)' : '(Not Significant)'}</span>
                                                    <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-100 border border-blue-400 rounded-sm"></span> Critical Range ({confidenceLevel}%)</span>
                                                </div>
                                            </div>

                                            {/* Phoneme Score Visualization - only show if both tests use phoneme mode */}
                                            {(baselineTest.scoringMode === 'phoneme' && comparisonTest.scoringMode === 'phoneme') && (
                                                <div>
                                                    <div className="text-xs font-semibold text-slate-600 mb-2">Phoneme Score Range</div>
                                                    <div className="relative h-20 bg-white border border-slate-300 rounded-lg px-3">
                                                        {/* Scale markers */}
                                                        <div className="absolute inset-x-0 top-1 flex justify-between px-3 text-[10px] text-slate-400">
                                                            <span>0%</span>
                                                            <span>25%</span>
                                                            <span>50%</span>
                                                            <span>75%</span>
                                                            <span>100%</span>
                                                        </div>

                                                        {/* Critical range bar */}
                                                        <div
                                                            className="absolute top-9 h-6 bg-indigo-100 border-l-2 border-r-2 border-indigo-400"
                                                            style={{
                                                                left: `${phonemeCriticalLimits.lower}%`,
                                                                width: `${phonemeCriticalLimits.upper - phonemeCriticalLimits.lower}%`
                                                            }}
                                                        >
                                                        </div>

                                                        {/* Baseline marker */}
                                                        <div
                                                            className="absolute top-8 w-1.5 h-8 bg-purple-600 z-10 shadow-lg"
                                                            style={{ left: `calc(${baselineStats.phonemePercent}% - 3px)` }}
                                                            title={`Test ${baselineTest.id}: ${baselineStats.phonemePercent}%`}
                                                        >
                                                            <div className="absolute top-9 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-bold text-purple-600">
                                                                {baselineTest.id}: {baselineStats.phonemePercent}%
                                                            </div>
                                                        </div>

                                                        {/* Comparison marker */}
                                                        <div
                                                            className={`absolute top-8 w-1.5 h-8 z-10 shadow-lg ${isPhonemeDiffSig ? 'bg-emerald-600' : 'bg-orange-500'}`}
                                                            style={{ left: `calc(${comparisonStats.phonemePercent}% - 3px)` }}
                                                            title={`Test ${comparisonTest.id}: ${comparisonStats.phonemePercent}%`}
                                                        >
                                                            <div className={`absolute top-9 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-bold ${isPhonemeDiffSig ? 'text-emerald-600' : 'text-orange-600'}`}>
                                                                {comparisonTest.id}: {comparisonStats.phonemePercent}%
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="mt-2 text-xs text-slate-500 flex items-center gap-3">
                                                        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-purple-600 rounded-sm"></span> Test {baselineTest.id}</span>
                                                        <span className="flex items-center gap-1"><span className={`w-3 h-3 rounded-sm ${isPhonemeDiffSig ? 'bg-emerald-600' : 'bg-orange-500'}`}></span> Test {comparisonTest.id} {isPhonemeDiffSig ? '(Significant)' : '(Not Significant)'}</span>
                                                        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-indigo-100 border border-indigo-400 rounded-sm"></span> Critical Range ({confidenceLevel}%)</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Outcome */}
                                        <div className="space-y-4">
                                            <div>
                                                <div className="flex justify-between items-center mb-2">
                                                    <label className="block text-xs font-bold uppercase text-slate-500">Outcome</label>
                                                    <select
                                                        value={outcomeMode}
                                                        onChange={(e) => {
                                                            setOutcomeMode(e.target.value);
                                                            setHasUnsavedChanges(true);
                                                            // Reset outcome to default for new mode
                                                            if (e.target.value === 'Validation') {
                                                                setOutcome('Validation Completed');
                                                            } else {
                                                                setOutcome('Sold');
                                                            }
                                                        }}
                                                        className="text-xs border-none bg-slate-100 rounded px-2 py-1 font-semibold text-slate-600 focus:ring-0 cursor-pointer hover:bg-slate-200"
                                                    >
                                                        <option value="Demo">Demo Mode</option>
                                                        <option value="Validation">Validation Mode</option>
                                                    </select>
                                                </div>

                                                {outcomeMode === 'Demo' ? (
                                                    <div className="flex gap-4">
                                                        <div className="flex rounded-lg overflow-hidden border border-slate-200">
                                                            <button onClick={() => { setOutcome('Sold'); setHasUnsavedChanges(true); }} className={`px-6 py-2 text-sm font-medium transition ${outcome === 'Sold' ? 'bg-emerald-600 text-white' : 'bg-gradient-to-br from-slate-50 to-blue-50 hover:bg-slate-100 text-slate-600'}`}>Sold</button>
                                                            <button onClick={() => { setOutcome('Not Sold'); setHasUnsavedChanges(true); }} className={`px-6 py-2 text-sm font-medium transition ${outcome === 'Not Sold' ? 'bg-red-600 text-white' : 'bg-gradient-to-br from-slate-50 to-blue-50 hover:bg-slate-100 text-slate-600'}`}>Not Sold</button>
                                                            <button onClick={() => { setOutcome('Need to Follow Up'); setHasUnsavedChanges(true); }} className={`px-6 py-2 text-sm font-medium transition ${outcome === 'Need to Follow Up' ? 'bg-blue-600 text-white' : 'bg-gradient-to-br from-slate-50 to-blue-50 hover:bg-slate-100 text-slate-600'}`}>Need to Follow Up</button>
                                                        </div>
                                                        {outcome === 'Sold' && (
                                                            <div className="flex-1">
                                                                <select value={soldType} onChange={(e) => { setSoldType(e.target.value); setHasUnsavedChanges(true); }} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm">
                                                                    <option value="Private Pay">Private Pay</option>
                                                                    <option value="Managed Care">Managed Care</option>
                                                                    <option value="Vocational Rehabilitation Services">Vocational Rehabilitation Services</option>
                                                                </select>
                                                            </div>
                                                        )}
                                                        {outcome === 'Not Sold' && (
                                                            <div className="flex-1">
                                                                <select value={notSoldReason} onChange={(e) => { setNotSoldReason(e.target.value); setHasUnsavedChanges(true); }} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm">
                                                                    <option value="Price">Price</option>
                                                                    <option value="Current Hearing Aids Too New">Current Hearing Aids Too New</option>
                                                                    <option value="Patient Considers Themselves Too Old">Patient Considers Themselves Too Old</option>
                                                                    <option value="Question of Value">Question of Value</option>
                                                                    <option value="No Benefit">No Benefit</option>
                                                                    <option value="Other">Other</option>
                                                                </select>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="space-y-3">
                                                        <div className="flex gap-4">
                                                            <div className="flex rounded-lg overflow-hidden border border-slate-200">
                                                                <button onClick={() => { setOutcome('Validation Completed'); setHasUnsavedChanges(true); }} className={`px-6 py-2 text-sm font-medium transition ${outcome === 'Validation Completed' ? 'bg-emerald-600 text-white' : 'bg-gradient-to-br from-slate-50 to-blue-50 hover:bg-slate-100 text-slate-600'}`}>Validation Completed</button>
                                                                <button onClick={() => { setOutcome('Retest Needed'); setHasUnsavedChanges(true); }} className={`px-6 py-2 text-sm font-medium transition ${outcome === 'Retest Needed' ? 'bg-orange-600 text-white' : 'bg-gradient-to-br from-slate-50 to-blue-50 hover:bg-slate-100 text-slate-600'}`}>Retest Needed</button>
                                                            </div>
                                                            <div className="flex-1 max-w-xs">
                                                                <div className="relative">
                                                                    <label className="absolute -top-2 left-2 bg-white px-1 text-[10px] uppercase font-bold text-slate-500">IOI-HA Score</label>
                                                                    <input
                                                                        type="number"
                                                                        step="0.1"
                                                                        value={ioiHaScore}
                                                                        onChange={(e) => { setIoiHaScore(e.target.value); setHasUnsavedChanges(true); }}
                                                                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                                                                        placeholder="Score (e.g. 4.5)"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="mt-6"><label className="block text-xs font-bold uppercase text-slate-500 mb-2">Clinical Interpretation / Notes</label><textarea value={clinicalNotes} onChange={(e) => { setClinicalNotes(e.target.value); setHasUnsavedChanges(true); }} className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 h-24" placeholder="Enter notes comparing the two conditions..."></textarea></div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'history' && (
                            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }} className="glass rounded-3xl p-8 print:shadow-none print:border-2 print:border-black">
                                <HistoryChart cNumber={cNumber} />
                            </motion.div>
                        )}
                    </div>
                </div>
            );
        };

        export default App;
