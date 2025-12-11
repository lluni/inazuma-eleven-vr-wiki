# Inazuma Eleven Mechanics

## Attributes
Each character has different values for a set of attributes, which contributes to the results of the minigame mechanics.

### BASE STATS
- Kick: determines **Shoot AT** (x1.0) and partially **Focus AT** (x0.5).
- Control: determines **Shoot AT** (x1.0) and **Focus AT** (x1.0).
- Technique: determines **Focus AT** (x1.0) and **Focus DF** (x1.0).
- Intelligence: determines **Focus DF** (x1.0), **Scramble AT** (x1.0), and **Scramble DF** (x1.0).
- Pressure: determines **Scramble DF** (x1.0), **Walls DF** (x1.0), and **KP** (x2.0).
- Physical: determines **Scramble AT** (x1.0), **Walls DF** (x1.0), and **KP** (x3.0).
- Agility: determines **Focus DF** (x0.5) and **KP** (x4.0)

### BASE VALUES FORMULAS
- Base Shoot AT formula: (Kick x1.0) + (Control x1.0)
This is the shooting value during the Zone, before selecting any command and while already in possession of the ball. All bonuses are excluded.

- Base Wall DF formula: (Pressure x1.0) + (Physical x1.0)
This formula results in the wall value, which receives a 20% bonus when the defender has an elemental advantage over the kicker/shooter.

- Base Focus AT formula: (Technique x1.0) + (Control x1.0) + (Kick x0.5)
The change compared to the Beta is that a partial bonus from the **Kick** stat has been included.

- Base Focus DF formula: (Technique x1.0) + (Intelligence x1.0) + (Agility x0.5)
Same goes for **Focus DF** but, conversely, there is a partial bonus from **Agility**.

- Base KP formula: (Pressure x2.0) + (Physical x3.0) + (Agility x4.0)
The obtained value is the goalkeeper's "HP" bar, excluding all types of general bonuses and those applied after selecting the shot/save (e.g., elemental bonus against the player or the technique).

- Base Scramble AT formula: (Intelligence x1.0) + (Physical x1.0)
This represents the chance of winning a high ball passed by a teammate.

- Base Scramble DF formula: (Intelligence x1.0) + (Pressure x1.0)
This represents the chance of winning a high ball launched by an opponent.

### FOCUS BATTLES ELEMENTAL ADVANTAGE
When one of the two players has a favorable match-up regarding the opponent's element, their base **AT/DF** increases by 20%

 e.g., if a Fire player attempts a dribble against a Wood player, the attacker gets a 20% increase on their   **AT**   value, while the defender gets no penalty. Vice versa, if the defender has the advantage, their base   **DF**   value will increase by 20%, while the attacker's   **AT**   will remain unchanged .

### HISSATSU'S POWER LEVEL UP AND HISSATSUS EVOLUTION
The **power of special moves depends** both on the **Character Level and Hissatsu Evolution Level**. During gameplay, once a special move is selected, the power is added to the base **AT/DF** value, after which elemental advantage bonuses are applied.

1. In general, a **technique's power increases by 5~6% of its base power with every level increase** (e.g., a technique with 30 base power will have 45 power at level 10, 61 power at level 20, and so on).
2. Furthermore, a technique's power also increases by **evolving the technique** itself equipping more copies of the same technique in the Abilearn Board**:** the technique's base power (already increased by the level) will receive an **additional 10% for every evolution level**.

Hissatsu's Power formula:`[(basePower) + (basePower * 5~6 * (Level-1) / 100)] + (basePower * Additional Hissatsu's Copies * 10 / 100)`

### HOW TO BUILD CHARACTERS
Finally, based on my testing, here are some suggestions on how to build players. Keep in mind that the entire equipment system is based on boosting stats in pairs, so the game designers and programmers have already foreseen that specialized builds would focus on two main stats, plus a tertiary one (sometimes chosen between two options).

**FORWARDS**
-  [Primary Stat] **Control:** better than **Kick** because it adds 100% to both shooting and dribbling.
-  [Secondary Stat] **Kick:** worse than **Control** because it only adds 50% of its value to dribbling
-  [Tertiary Stat] **Technique:** useful for dribbling and pressing, more suitable for wingers
-  [Tertiary Stat] **Intelligence:** useful for pressing and winning aerial duels, more useful for central strikers.

**MIDFIELDERS (Offensive)**
-  [Primary Stat] **Control:** useful for shooting, providing assists, and dribbling.
-  [Secondary Stat] **Technique:** fundamental for dribbling and defending in **Focus Battles**.
-  [Tertiary Stat] **Kick:** useful for shooting and providing assists; 50% of the value is also added to dribbling.

**MIDFIELDERS (Defensive) and DEFENDERS (Fullbacks)**
-  [Primary Stat] **Technique:** fundamental for dribbling and defending in **Focus Battles**.
-  [Secondary Stat] **Intelligence:** useful for defending in **Focus Battles** and winning aerial duels.
-  [Tertiary Stat] **Agility:** gives a small bonus to defense in **Focus Battles**.
-  [Tertiary Stat] **Pressure:** helps in aerial duels and walls.

**DEFENDERS (Central)**
-  [Primary Stat] **Pressure:** helps to build more solid walls and win aerial duels (initiated by opponents).
-  [Secondary Stat] **Physical:** useful for building walls and winning aerial duels (launched by teammates).
-  [Tertiary Stat] **Intelligence:** useful for defending better in **Focus Battles** and winning aerial contests.

**GOALKEEPERS**
-  [Primary Stat] **Agility:** best **KP** bonus (4x value).
-  [Secondary Stat] **Physical:** good **KP** bonus (3x value).
-  [Tertiary Stat] **Pressure:** little **KP** bonus (2x value).

## Project Guidelines
This is a guideline you must follow when working in the inazuma_guide project.

Project Knowledge:
- This is a personal project that provides a reference sheet and team builder for the game Inazuma Eleven.

Front-end code development:
- Use Tailwind CSS for styling.
- The project must be written in React for responsive design.
- For any icons, when necessary, use lucide-react.
- Use Jotai for state management.
- Avoid transitions, or do very quick transitions when applicable for experience.
- Avoid big spacing between elements, or do very small (gap-2, p-1, etc.)

Shadcn UI:
Use Shadcn UI for components. Assume all necessary components are available, ignore the warning about the missing components.
Components list
- @/components/ui/button.tsx
- @/components/ui/input.tsx
- @/components/ui/sidebar.tsx
- @/components/ui/tooltip.tsx
- @/components/ui/badge.tsx
- @/components/ui/separator.tsx
- @/components/ui/sheet.tsx
- @/components/ui/skeleton.tsx
- @/components/ui/dialog.tsx
- @/components/ui/table.tsx
- @/components/ui/sortable-table.tsx
- @/components/ui/popover.tsx

Code Standards:
- Ensure to componentize files and to separate functions by responsability.
- Act as to prevent code repetition and maintain code DRY. If you find opportunity to optimize, do it.

Theme and Color Scheme:
- The @index.css file must define the theme and color scheme according to the Shadcn UI guidelines.
- The CSS is already in Tailwind V4 correct format.
- Always lean towards stunning beauty and elegance, prioritizing the "WoW Factor" of the layouts.

User Storage:
- Use Local Storage with Jotai for state management.

Routing and Sidebar:
- Every page must be in the @/components/layout/AppLayout.tsx file and @/App.tsx file.

Pages:
- A page must use the entire width available, without any other components taking up space.
- Prefer vertical navigation, avoiding multiple horizontal columns.
- Add search and ordering functionality when applicable.
- Consider carefully the usability and experience of the page, knowing all content is for consultation by players that are currently playing.
- Prioritize good design for mobile devices, considering all components must be responsive and suited to navigation by touch.
- Strongly leans toward visual indicators through icons, colors and distribution of elements. Avoid labeling and explaining everything.