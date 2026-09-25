# Exercice 6 – Connecter le frontend au backend

**Objectif** : le frontend ne garde plus ses propres données en dur. Il demande la liste des dépenses au backend Express, lui envoie les nouvelles dépenses et peut réinitialiser les données.

```
Home.tsx  ──utilise──▶  useExpenses()  ──fetch──▶  Vite (5173)  ──proxy──▶  Express (3000)
 (affichage)            (données + appels)          /api/...                  /api/expenses
```

Avant de commencer, vérifie que le backend répond :

```bash
curl -s http://localhost:3000/api/expenses | jq
```

Si tu obtiens une 404, corrige d'abord le montage du router dans `app.ts` (`app.use("/api/expenses", router)` si tes routes sont sur `"/"`).

---

## Étape 1 – Le proxy Vite (`vite.config.ts`)

On veut écrire `fetch("/api/expenses")` dans le frontend, sans mettre `http://localhost:3000` en dur. Le proxy dit à Vite : « toute requête qui commence par `/api`, transmets-la au backend ».

```ts
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});
```

**Pourquoi ?**
- Le navigateur croit parler à `localhost:5173` (la même origine que la page), donc **plus de problème de CORS** en développement.
- Le jour où l'API sera ailleurs (en production par exemple), il n'y aura qu'un seul endroit à changer.

> ⚠️ Il faut **redémarrer `npm run dev`** après avoir modifié `vite.config.ts`.

---

## Étape 2 – Le hook `useExpenses` (`src/hooks/useExpenses.ts`)

Un **hook personnalisé**, c'est simplement une fonction dont le nom commence par `use` et qui utilise d'autres hooks (`useState`, `useEffect`…). Il regroupe toute la logique « données » pour que `Home` ne s'occupe que de l'affichage.

```ts
import { useEffect, useState } from "react";
import type { Expense } from "../types/Expense";

const API_URL = "/api/expenses";

export default function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Va chercher la liste sur le backend
  const fetchExpenses = async () => {
    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error(`Erreur HTTP ${response.status}`);
      const data: Expense[] = await response.json();
      setExpenses(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  // Appelé UNE fois, quand le composant apparaît à l'écran
  useEffect(() => {
    fetchExpenses();
  }, []);

  // Envoie une nouvelle dépense puis recharge la liste
  const addExpense = async (expense: Expense) => {
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(expense),
      });
      if (!response.ok) throw new Error(`Erreur HTTP ${response.status}`);
      await fetchExpenses();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    }
  };

  // Réinitialise les données puis recharge la liste.
  // Renvoie true/false pour que Home sache s'il doit afficher un message.
  const resetExpenses = async (): Promise<boolean> => {
    try {
      const response = await fetch(`${API_URL}/reset`, { method: "POST" });
      if (!response.ok) throw new Error(`Erreur HTTP ${response.status}`);
      await fetchExpenses();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
      return false;
    }
  };

  return { expenses, loading, error, addExpense, resetExpenses };
}
```

### Les points importants

| Élément | Explication |
|---|---|
| `useState<Expense[]>([])` | On démarre avec une liste **vide** : les données arrivent du serveur. |
| `loading` à `true` au départ | Tant que la première réponse n'est pas arrivée, on n'a rien à afficher. |
| `useEffect(..., [])` | Le `[]` vide veut dire « exécute ça une seule fois, au montage ». Sans lui, chaque rendu relancerait le fetch, qui mettrait à jour le state, qui relancerait un rendu… **boucle infinie**. |
| `if (!response.ok) throw …` | ⚠️ `fetch` **ne lève pas d'erreur** sur une 404 ou une 500 : il ne le fait que si le réseau est coupé. Il faut vérifier `response.ok` soi-même. |
| `await response.json()` | Transforme le texte JSON reçu en tableau JavaScript (l'inverse de `res.json()` côté Express). |
| `headers: { "Content-Type": "application/json" }` | Sans cet en-tête, `express.json()` ne lit pas le body et `req.body` reste vide. |
| `JSON.stringify(expense)` | On ne peut envoyer que du texte : on transforme l'objet en JSON. |
| `await fetchExpenses()` après POST | Le serveur est la **source de vérité** : on recharge la liste depuis lui au lieu de modifier le state à la main. |
| `e instanceof Error` | En TypeScript, une erreur attrapée est de type `unknown` : on vérifie avant de lire `.message`. |

> 💡 **Avertissement possible** : l'énoncé prévient qu'oxlint peut signaler `set-state-in-effect` (un setter appelé dans un `useEffect`). C'est normal et voulu pour cet exercice : on verra de meilleurs outils de fetch plus tard dans le cours.

---

## Étape 3 – Mettre à jour `Home.tsx`

`Home` perd son `useState` et ses données en dur (`mockExpenses`) : tout vient maintenant du hook.

```tsx
import { useState } from "react";
import ExpenseAdd from "../components/ExpenseAdd";
import ExpenseItem from "../components/ExpenseItem";
import useExpenses from "../hooks/useExpenses";

export default function Home() {
  const { expenses, loading, error, addExpense, resetExpenses } = useExpenses();
  const [message, setMessage] = useState<string | null>(null);

  const handleReset = async () => {
    const ok = await resetExpenses();
    if (ok) {
      setMessage("Données réinitialisées !");
      setTimeout(() => setMessage(null), 3000); // le message disparaît après 3 s
    }
  };

  if (loading) return <p>Chargement...</p>;

  return (
    <div>
      {error && <p style={{ color: "red" }}>Erreur : {error}</p>}
      {message && <p style={{ color: "green" }}>{message}</p>}

      {expenses.map((expense) => (
        <ExpenseItem key={expense.id} expense={expense} />
      ))}

      <ExpenseAdd addExpense={addExpense} />
      <button onClick={handleReset}>Reset Data</button>
    </div>
  );
}
```

### Ce qui a changé par rapport à l'exercice 3

- **Avant** : `Home` avait `useState(mockExpenses)` et sa propre fonction `handleAddExpense` qui appelait `setExpenses`.
- **Maintenant** : `Home` récupère `addExpense` du hook et le passe **tel quel** à `ExpenseAdd`. La prop s'appelle toujours `addExpense`, donc **`ExpenseAdd.tsx` ne change pas du tout**. C'est l'intérêt des props : le composant ne sait pas (et n'a pas besoin de savoir) si la fonction modifie un state local ou appelle un serveur.
- `{error && <p>…</p>}` : un raccourci pour « affiche le paragraphe seulement si `error` n'est pas `null` ».
- `const ok = await resetExpenses()` : on attend la fin du reset avant d'afficher le message, sinon on afficherait « réinitialisé » même en cas d'échec.

---

## Étape 4 – Vérifier que tout marche

Lance les deux serveurs (`npm run dev` dans `backend/` **et** dans `frontend/`), puis :

- [ ] **Chargement** : au démarrage, la page affiche brièvement « Chargement... », puis les dépenses **du fichier `expenses.json`** (et plus les `mockExpenses`).
- [ ] **Ajout** : clic sur **Add** → une nouvelle ligne apparaît.
- [ ] **Persistance** : recharge la page (F5) → la dépense ajoutée est **toujours là**. C'est la preuve qu'elle est enregistrée côté serveur.
- [ ] **Fichier** : ouvre `backend/data/expenses.json` → la dépense y figure.
- [ ] **Reset** : clic sur **Reset Data** → le message vert s'affiche et il ne reste que les 3 dépenses de départ.
- [ ] **Erreur** : arrête le backend (Ctrl+C) puis recharge la page → un message d'erreur rouge s'affiche au lieu d'une page blanche.
- [ ] **Build** : `npm run build` passe sans erreur TypeScript.

### Si ça ne marche pas

| Symptôme | Cause probable |
|---|---|
| 404 sur `/api/expenses` dans l'onglet Réseau (F12) | Proxy absent ou `npm run dev` pas redémarré, ou mauvais montage du router dans `app.ts`. |
| Erreur « Unexpected token '<' … is not valid JSON » | La requête n'arrive pas au backend : Vite renvoie sa page HTML à la place. Vérifie le proxy. |
| La dépense s'ajoute puis disparaît au rechargement | `addExpense` du **service backend** n'écrit pas dans le fichier (`fs.writeFileSync`). |
| `req.body` vide côté serveur | En-tête `Content-Type` manquant dans le fetch, ou `app.use(express.json())` absent/placé après le router. |
| Erreur « 500 » au reset | `backend/data/expenses.init.json` introuvable (regarde les logs du backend). |
| Page blanche | Ouvre la console (F12) et lance `npm run build` pour voir l'erreur TypeScript. |
