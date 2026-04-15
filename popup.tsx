import { useEffect, useState } from "react"

import "./popup.css"

/**
 * Cloakd popup — one row per supported AI product, each with its own
 * toggle. State lives in chrome.storage.sync under a single key so
 * content scripts can listen with one handler.
 */

interface Product {
  id: string
  name: string
  host: string
  supported: boolean
}

const PRODUCTS: Product[] = [
  { id: "chatgpt", name: "ChatGPT", host: "chatgpt.com",       supported: true },
  { id: "gemini",  name: "Gemini",  host: "gemini.google.com", supported: false }
]

const STORAGE_KEY = "cloakd.enabled"
type EnabledMap = Record<string, boolean>

/** Read the enabled-map from storage, tolerating first-install (undefined). */
async function loadEnabled(): Promise<EnabledMap> {
  const result = await chrome.storage.sync.get([STORAGE_KEY])
  return (result[STORAGE_KEY] ?? {}) as EnabledMap
}

/** Persist a new enabled-map. */
async function saveEnabled(map: EnabledMap): Promise<void> {
  await chrome.storage.sync.set({ [STORAGE_KEY]: map })
}

/** Products default to enabled if no value has been written yet. */
const isOn = (map: EnabledMap, id: string): boolean => map[id] ?? true

function Popup() {
  const [enabled, setEnabled] = useState<EnabledMap>({})
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    loadEnabled().then((map) => {
      setEnabled(map)
      setLoaded(true)
    })

    // Stay in sync if another surface (another popup, another tab's
    // content script, Chrome Sync from another device) mutates state.
    const handler = (
      changes: Record<string, chrome.storage.StorageChange>,
      area: string
    ) => {
      if (area !== "sync") return
      const change = changes[STORAGE_KEY]
      if (!change) return
      setEnabled((change.newValue ?? {}) as EnabledMap)
    }
    chrome.storage.onChanged.addListener(handler)
    return () => chrome.storage.onChanged.removeListener(handler)
  }, [])

  const toggle = async (id: string) => {
    const next: EnabledMap = { ...enabled, [id]: !isOn(enabled, id) }
    setEnabled(next) // optimistic
    await saveEnabled(next)
  }

  return (
    <div className="popup">
      <header>
        <div className="title">Cloakd</div>
        <div className="subtitle">Claude-style reskin</div>
      </header>

      <ul className="products">
        {PRODUCTS.map((p) => {
          const on = isOn(enabled, p.id)
          return (
            <li key={p.id} className={p.supported ? "" : "disabled"}>
              <div className="meta">
                <div className="name">{p.name}</div>
                <div className="host">{p.host}</div>
              </div>
              {p.supported ? (
                <button
                  type="button"
                  role="switch"
                  aria-checked={on}
                  aria-label={`${on ? "Disable" : "Enable"} ${p.name}`}
                  className={`toggle ${on ? "on" : "off"}`}
                  onClick={() => toggle(p.id)}
                  disabled={!loaded}
                />
              ) : (
                <span className="badge">Soon</span>
              )}
            </li>
          )
        })}
      </ul>

      <footer>
        Changes apply instantly. No page refresh needed.
      </footer>
    </div>
  )
}

export default Popup
