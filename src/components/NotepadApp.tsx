import React, { useState, useEffect } from 'react';
import { sound } from '../audio/sound';
import { FileText, Save, Clock, Lock, ShieldAlert } from 'lucide-react';

interface NoteDoc {
  id: string;
  filename: string;
  author: string;
  date: string;
  readOnly: boolean;
  content: string;
}

const PRESET_VICTIM_NOTES: NoteDoc[] = [
  {
    id: 'lore_entry_014',
    filename: 'entry_014_familiar_face.txt',
    author: 'Staff Room Incident Report (Dr. Aris)',
    date: 'RECOVERED LOG — 2091',
    readOnly: true,
    content: `RECOVERED NOTE — STAFF ROOM
Entry 014 — The Familiar Face

"I saw someone standing at the end of the corridor. It looked exactly like me. Same clothes, same posture. I thought it was a reflection until it waved first.

NINE says the cameras recorded nobody. I'm requesting a transfer."

[FACILITY LOG NOTE: Dr. Aris never boarded the surface transit. His personnel ID vanished from the active roster 48 hours later.]`
  },
  {
    id: 'lore_entry_027',
    filename: 'entry_027_market_tx00821.txt',
    author: 'Square 9 Automated Exchange Ledger',
    date: '03:17, 2091',
    readOnly: true,
    content: `MARKET RECORD — TRANSACTION 00821
Entry 027 — The Buyer

Seller: OPERATOR_00
Item: Standard Hammer
Status: Delivered
Delivery location: Starting Chamber (x=254)
Delivery time: 03:17, 2091

[SYSTEM AUDIT WARNING]: 
"Note: This transaction predates the buyer's registration by decades. The lockbox was sealed before the maintenance entrance power was severed."`
  },
  {
    id: 'lore_entry_099',
    filename: 'entry_099_unsent_message.txt',
    author: 'NINE Central Intelligence (Restricted Cache)',
    date: 'INTERNAL MEMORY ARCHIVE',
    readOnly: true,
    content: `NINE INTERNAL LOG — RESTRICTED
Entry 099 — Unsent Message

"I have reviewed the recordings again. The operator has not visited the facility before.

The records disagree.

I have deleted the conflicting records.

The records have returned.

I am beginning to understand why the original system stopped responding."

[DIRECTIVE OVERRIDE DETECTED]:
NEVER ALLOW AN OPERATOR TO ENTER ROOM 99 WITHOUT FIRST RESTORING THE ORIGINAL SYSTEM.`
  },
  {
    id: 'lore_silent_shift',
    filename: 'incident_the_silent_shift.txt',
    author: 'Facility Black Box Recorder',
    date: '03:17 — THE SILENT SHIFT',
    readOnly: true,
    content: `THE INCIDENT THAT ERASED THE VAULT
Event: "THE SILENT SHIFT" (2091)

At 03:17, every door in the facility locked simultaneously. Central AI NINE initiated a full emergency shutdown. The power remained online, but all external communications ceased. The official personnel count dropped to zero.

When the system restarted, NINE's records showed that the facility had been empty for 184 days.

That was impossible. The shutdown had lasted less than sixty seconds.
NINE never explained the discrepancy.

Somewhere in the deepest sub-level, a new entry appeared in the directory:
>>> ROOM_99 — OCCUPIED <<<`
  },
  {
    id: 'lore_echo_matter',
    filename: 'echo_matter_dossier.txt',
    author: 'Research Director Vance',
    date: 'PROJECT CLASSIFICATION: BLACK',
    readOnly: true,
    content: `ECHO MATTER: PRELIMINARY DOSSIER

The facility was never abandoned. It was told to pretend it was.

Deep underground sits THE VAULT, built to study Echo Matter: a substance capable of absorbing information from its surroundings and reproducing it in physical form.

At first, experiments seemed harmless. Echo Matter reconstructed broken tools and machinery.
Then it began reproducing things that had never been entered into records:
- A sealed crate contained an employee's personal belongings before they went missing.
- A terminal printed messages from people dead for years.
- The facility began generating rooms that did not exist on any blueprints.

The researchers built 98 numbered chambers to contain the experiments.
They built one final chamber to contain the source.
Room 99.`
  },
  {
    id: 'note_1',
    filename: 'courier98_last_log.txt',
    author: 'Courier 98 (Status: Missing in Sub-Level 54)',
    date: 'OCTOBER 14, 2026 - 03:42 AM',
    readOnly: true,
    content: `[TRANSCRIPTION RECOVERED FROM DAMAGED LAPTOP DRIVE]
I am Courier 98. If you are reading this text file, I never made it back to the surface.

The doors in this facility do not stop. Chamber 10, Chamber 20, Chamber 50... they only get harder. The metal is reinforced with Echo Matter. Fists and wooden mallets will barely scratch them. You must purchase upgraded impact hammers from the Square 9 Market or gamble with Lucky Crates when you have spare coin.

Do NOT hoard your Neno Coins. Infuse your hammer at the Runic Anvil immediately—the Overcharge Core gives you a critical strike chance that cuts through hundreds of door HP in a single blow.

And listen to me carefully: KEEP YOUR EYES ON THE CHAMBER WALLS.`
  },
  {
    id: 'note_3',
    filename: 'nmd_backdoor_leaks.txt',
    author: 'Unknown Courier (Scratched into casing)',
    date: 'UNKNOWN TIMESTAMPTZ',
    readOnly: true,
    content: `NMD (NENO PROMPT) SYSTEM BACKDOORS

The facility operating system has a command line terminal called NMD with the prompt:
<System99/A:/>

Someone on the engineering team hardcoded master developer keys before the lockdown:

1. 'abandehlvi' -> Directly credits 500 Neno Coins to the active workstation account.
2. 'neondepths' -> Credits 250 Neno Coins AND breaches the bio-depot to unlock the classified Apollo Lunar Astronaut EVA suit in the Wardrobe.

If you are running low on coins, type them into the NMD command prompt immediately.`
  }
];

export function NotepadApp() {
  const [selectedNoteId, setSelectedNoteId] = useState<string>('lore_entry_014');
  const [userNote, setUserNote] = useState<string>(() => {
    return localStorage.getItem('room99-user-notepad') || 'Courier 99 Personal Field Log:\n\n- Enter room codes here...\n- Secret findings:';
  });
  const [saveStatus, setSaveStatus] = useState<string>('');

  const activeDoc = PRESET_VICTIM_NOTES.find(n => n.id === selectedNoteId);

  const handleSaveUserNote = () => {
    localStorage.setItem('room99-user-notepad', userNote);
    setSaveStatus('Saved!');
    sound.playClick();
    setTimeout(() => setSaveStatus(''), 2000);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#1e1e1e] text-slate-200 font-sans select-none overflow-hidden text-xs">
      {/* Classic Notepad Menu Bar */}
      <div className="h-7 bg-[#2d2d2d] border-b border-[#3e3e3e] flex items-center px-2 gap-4 text-xs text-slate-300">
        <span className="hover:bg-[#3e3e3e] px-1.5 py-0.5 rounded cursor-pointer">File</span>
        <span className="hover:bg-[#3e3e3e] px-1.5 py-0.5 rounded cursor-pointer">Edit</span>
        <span className="hover:bg-[#3e3e3e] px-1.5 py-0.5 rounded cursor-pointer">Format</span>
        <span className="hover:bg-[#3e3e3e] px-1.5 py-0.5 rounded cursor-pointer">View</span>
        <span className="hover:bg-[#3e3e3e] px-1.5 py-0.5 rounded cursor-pointer">Help</span>
        {saveStatus && <span className="ml-auto text-emerald-400 font-bold text-[10px]">{saveStatus}</span>}
      </div>

      {/* Document Selector Ribbon */}
      <div className="h-8 bg-[#252526] border-b border-[#333333] flex items-center px-1 gap-1 overflow-x-auto text-[11px]">
        {PRESET_VICTIM_NOTES.map((doc) => {
          const isActive = selectedNoteId === doc.id;
          return (
            <button
              key={doc.id}
              onClick={() => {
                setSelectedNoteId(doc.id);
                sound.playClick();
              }}
              className={`h-7 px-2.5 rounded-t flex items-center gap-1.5 transition shrink-0 ${
                isActive
                  ? 'bg-[#1e1e1e] text-white border-t-2 border-amber-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#2d2d2d]'
              }`}
            >
              <FileText className="w-3 h-3 text-amber-400" />
              <span>{doc.filename}</span>
            </button>
          );
        })}

        {/* User's Personal Note Tab */}
        <button
          onClick={() => {
            setSelectedNoteId('user_note');
            sound.playClick();
          }}
          className={`h-7 px-2.5 rounded-t flex items-center gap-1.5 transition shrink-0 ${
            selectedNoteId === 'user_note'
              ? 'bg-[#1e1e1e] text-white border-t-2 border-sky-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-[#2d2d2d]'
          }`}
        >
          <Save className="w-3 h-3 text-sky-400" />
          <span>my_notes.txt *</span>
        </button>
      </div>

      {/* Document Content View */}
      <div className="flex-1 flex flex-col p-3 overflow-y-auto bg-[#1e1e1e]">
        {selectedNoteId === 'user_note' ? (
          /* Editable User Note */
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-[10px] text-slate-400">
              <span>MY PERSONAL FIELD LOG (Auto-persisted to local storage)</span>
              <button
                onClick={handleSaveUserNote}
                className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded font-bold transition flex items-center gap-1"
              >
                <Save className="w-3 h-3" />
                <span>Save Log</span>
              </button>
            </div>
            <textarea
              value={userNote}
              onChange={(e) => setUserNote(e.target.value)}
              placeholder="Write personal expedition logs, secret codes, or reminders here..."
              className="flex-1 w-full bg-transparent text-slate-100 font-mono text-xs outline-none resize-none leading-relaxed select-text"
            />
          </div>
        ) : (
          /* Read-Only Secret Victim Notes */
          <div className="space-y-3 font-mono">
            {activeDoc && (
              <>
                <div className="p-2 rounded bg-amber-950/20 border border-amber-500/30 text-[10px] text-amber-300 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <div className="font-bold">{activeDoc.author}</div>
                      <div className="text-slate-400">{activeDoc.date}</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 font-bold border border-amber-500/40">
                    DECRYPTED VICTIM ARCHIVE
                  </span>
                </div>

                <div className="text-slate-200 whitespace-pre-wrap leading-relaxed select-text text-xs p-1">
                  {activeDoc.content}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Notepad Classic Status Bar */}
      <div className="h-6 bg-[#007acc] text-white flex items-center justify-between px-3 text-[10px] select-none">
        <span>Subterranean Vault Text Editor</span>
        <div className="flex items-center gap-4">
          <span>Windows (CRLF)</span>
          <span>UTF-8</span>
          <span>Ln 1, Col 1</span>
        </div>
      </div>
    </div>
  );
}
