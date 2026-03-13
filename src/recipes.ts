export interface Recipe {
  name: string
  portions: number
  minutes: number
  category: string
  ingredients: string[]
}

const recipes: Recipe[] = [
  {
    name: 'Züri Geschnetzeltes mit Rösti',
    portions: 4,
    minutes: 45,
    category: 'Hauptgericht',
    ingredients: ['500g Kalbfleisch', '200g Champignons', '1 Zwiebel', '2 dl Rahm', '1 dl Weisswein', 'Butter', 'Mehl', '800g Kartoffeln', 'Salz', 'Pfeffer'],
  },
  {
    name: 'Birchermüesli',
    portions: 4,
    minutes: 15,
    category: 'Frühstück',
    ingredients: ['200g Haferflocken', '2 Äpfel', '1 Zitrone', '2 dl Milch', '150g Joghurt', '2 EL Honig', '50g Nüsse', '100g Beeren'],
  },
  {
    name: 'Käsespätzle',
    portions: 4,
    minutes: 40,
    category: 'Hauptgericht',
    ingredients: ['400g Mehl', '4 Eier', '200g Bergkäse gerieben', '2 Zwiebeln', 'Butter', 'Salz', 'Muskatnuss', 'Schnittlauch'],
  },
  {
    name: 'Kartoffelsuppe',
    portions: 4,
    minutes: 35,
    category: 'Suppe',
    ingredients: ['600g Kartoffeln', '1 Lauch', '2 Karotten', '1 Zwiebel', '1 l Gemüsebrühe', '1 dl Rahm', 'Muskatnuss', 'Petersilie', 'Salz', 'Pfeffer'],
  },
  {
    name: 'Wiener Schnitzel',
    portions: 4,
    minutes: 30,
    category: 'Hauptgericht',
    ingredients: ['4 Kalbsschnitzel', '100g Mehl', '2 Eier', '200g Semmelbrösel', 'Butterschmalz', '1 Zitrone', 'Salz', 'Petersilie'],
  },
  {
    name: 'Capuns (Bündner Spezialität)',
    portions: 4,
    minutes: 50,
    category: 'Hauptgericht',
    ingredients: ['200g Spätzlimehl', '100g Bündnerfleisch', '1 Landjäger', '100g Salsiz', '2 Eier', '1 dl Milch', 'Mangoldblätter', '3 dl Bouillon', '2 dl Rahm', '100g Bergkäse'],
  },
  {
    name: 'Älplermagronen',
    portions: 4,
    minutes: 35,
    category: 'Hauptgericht',
    ingredients: ['300g Magronen (Penne)', '400g Kartoffeln', '200g Gruyère gerieben', '2 Zwiebeln', '2 dl Rahm', 'Butter', 'Apfelmus', 'Salz', 'Pfeffer'],
  },
  {
    name: 'Flammkuchen',
    portions: 4,
    minutes: 30,
    category: 'Hauptgericht',
    ingredients: ['300g Mehl', '2 EL Olivenöl', '200g Crème fraîche', '200g Speck', '2 Zwiebeln', 'Salz', 'Pfeffer', 'Muskatnuss'],
  },
  {
    name: 'Linsensuppe',
    portions: 4,
    minutes: 40,
    category: 'Suppe',
    ingredients: ['250g rote Linsen', '2 Karotten', '1 Zwiebel', '2 Knoblauchzehen', '1 Dose Tomaten', '1 l Gemüsebrühe', 'Kreuzkümmel', 'Kurkuma', 'Olivenöl', 'Salz'],
  },
  {
    name: 'Poulet-Geschnetzeltes mit Reis',
    portions: 4,
    minutes: 30,
    category: 'Hauptgericht',
    ingredients: ['500g Pouletbrust', '1 Peperoni', '200g Champignons', '1 Zwiebel', '2 dl Rahm', '300g Reis', 'Paprikapulver', 'Olivenöl', 'Salz', 'Pfeffer'],
  },
  {
    name: 'Bündner Gerstensuppe',
    portions: 4,
    minutes: 60,
    category: 'Suppe',
    ingredients: ['150g Rollgerste', '100g Speck', '2 Karotten', '1 Sellerie', '1 Lauch', '1 Zwiebel', '1.5 l Bouillon', 'Lorbeerblatt', 'Petersilie', 'Salz'],
  },
  {
    name: 'Zürcher Eintopf',
    portions: 4,
    minutes: 50,
    category: 'Hauptgericht',
    ingredients: ['400g Rindshackfleisch', '4 Kartoffeln', '2 Karotten', '1 Lauch', '1 Dose Tomaten', '1 Zwiebel', '5 dl Bouillon', 'Thymian', 'Salz', 'Pfeffer'],
  },
  {
    name: 'Pasta Carbonara',
    portions: 4,
    minutes: 25,
    category: 'Hauptgericht',
    ingredients: ['400g Spaghetti', '200g Speck (Guanciale)', '4 Eigelb', '100g Parmesan', '2 Knoblauchzehen', 'Pfeffer', 'Salz'],
  },
  {
    name: 'Gemüse-Curry mit Naan',
    portions: 4,
    minutes: 35,
    category: 'Hauptgericht',
    ingredients: ['1 Blumenkohl', '2 Kartoffeln', '200g Kichererbsen (Dose)', '1 Dose Kokosmilch', '2 EL Currypaste', '1 Zwiebel', '2 Knoblauchzehen', 'Ingwer', 'Naan-Brot', 'Koriander'],
  },
  {
    name: 'Raclette',
    portions: 4,
    minutes: 20,
    category: 'Hauptgericht',
    ingredients: ['400g Raclette-Käse', '800g Kartoffeln (festkochend)', 'Cornichons', 'Silberzwiebeln', 'Pfeffer', 'Paprikapulver'],
  },
  {
    name: 'Risotto mit Pilzen',
    portions: 4,
    minutes: 40,
    category: 'Hauptgericht',
    ingredients: ['300g Risotto-Reis', '300g gemischte Pilze', '1 Zwiebel', '1 dl Weisswein', '8 dl Bouillon', '50g Parmesan', 'Butter', 'Olivenöl', 'Petersilie', 'Salz'],
  },
  {
    name: 'Cervelas-Salat',
    portions: 4,
    minutes: 15,
    category: 'Salat',
    ingredients: ['4 Cervelats', '2 Tomaten', '1 Zwiebel', '1 Peperoni', 'Essiggurken', '3 EL Essig', '4 EL Öl', 'Senf', 'Schnittlauch', 'Salz', 'Pfeffer'],
  },
  {
    name: 'Ghackets mit Hörnli',
    portions: 4,
    minutes: 30,
    category: 'Hauptgericht',
    ingredients: ['500g Rindshackfleisch', '400g Hörnli', '2 Zwiebeln', '2 dl Bouillon', '1 EL Tomatenmark', 'Apfelmus', 'Butter', 'Salz', 'Pfeffer'],
  },
  {
    name: 'Zopf (Sonntagszopf)',
    portions: 8,
    minutes: 90,
    category: 'Brot',
    ingredients: ['500g Mehl', '1 Würfel Hefe', '1 TL Salz', '80g Butter', '2.5 dl Milch', '1 Ei', '1 EL Zucker'],
  },
  {
    name: 'Lachs mit Gemüse',
    portions: 4,
    minutes: 25,
    category: 'Hauptgericht',
    ingredients: ['4 Lachsfilets', '1 Zucchetti', '1 Peperoni', '200g Cherrytomaten', '2 Knoblauchzehen', 'Olivenöl', 'Zitrone', 'Dill', 'Salz', 'Pfeffer'],
  },
  {
    name: 'Minestrone',
    portions: 4,
    minutes: 40,
    category: 'Suppe',
    ingredients: ['2 Karotten', '2 Kartoffeln', '1 Zucchetti', '100g grüne Bohnen', '1 Dose Tomaten', '100g kleine Pasta', '1 Zwiebel', '1 l Gemüsebrühe', 'Parmesan', 'Basilikum'],
  },
  {
    name: 'Fondue (Moitié-Moitié)',
    portions: 4,
    minutes: 20,
    category: 'Hauptgericht',
    ingredients: ['400g Gruyère', '400g Vacherin Fribourgeois', '3 dl Weisswein', '1 Knoblauchzehe', '1 EL Maizena', '1 Schuss Kirsch', 'Brot (800g)', 'Pfeffer', 'Muskatnuss'],
  },
  {
    name: 'Wurst-Käse-Salat',
    portions: 4,
    minutes: 15,
    category: 'Salat',
    ingredients: ['200g Lyoner', '200g Emmentaler', '1 Zwiebel', 'Essiggurken', '3 EL Essig', '4 EL Öl', 'Senf', 'Schnittlauch', 'Salz', 'Pfeffer'],
  },
  {
    name: 'Gemüse-Quiche',
    portions: 6,
    minutes: 50,
    category: 'Hauptgericht',
    ingredients: ['1 Blätterteig (rund)', '2 Lauch', '1 Peperoni', '200g Broccoli', '3 Eier', '2 dl Rahm', '150g Gruyère gerieben', 'Muskatnuss', 'Salz', 'Pfeffer'],
  },
  {
    name: 'Chicken Teriyaki mit Reis',
    portions: 4,
    minutes: 30,
    category: 'Hauptgericht',
    ingredients: ['500g Pouletbrust', '300g Reis', '4 EL Sojasauce', '2 EL Honig', '1 EL Reisessig', '2 Knoblauchzehen', 'Ingwer', 'Sesam', 'Frühlingszwiebeln', 'Öl'],
  },
]

export default recipes

/**
 * Returns the recipe of the day based on the current date.
 * Rotates through all recipes, one per day.
 */
export function getRecipeOfTheDay(): Recipe {
  const today = new Date()
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000
  )
  return recipes[dayOfYear % recipes.length]
}
