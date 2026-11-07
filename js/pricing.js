/* =========================================================
   VALIER — prijsberekening op de achtergrond.
   Geeft een totaal en (alleen voor de aanvraag aan VALIER) een opbouw.
   Onbekende opties leveren nooit een verzonnen bedrag op: status 'aanvraag'.
   ========================================================= */
import { PRICING } from './catalog.js';
import { railProfile, railColor } from './state.js';

export function calculate(s, { withDelivery = false } = {}) {
  const P = PRICING;
  const lines = [], reasons = [];
  let total = 0, complete = true;

  if (!s.rails.length) return { status: 'leeg', total: 0, lines, reasons };
  if (s.stair.type === 'anders') reasons.push('Andere trap: maatwerk');

  // Rails
  for (const [i, r] of s.rails.entries()) {
    const prof = railProfile(s, r), col = railColor(s, r);
    const surP = P.profileSurcharge[prof], surC = P.colorSurcharge[col];
    if (s.lengthsUnknown || !r.lengthMm) { complete = false; reasons.push(`Leuning ${i + 1}: lengte onbekend`); continue; }
    if (surP == null) { complete = false; reasons.push(`Leuning ${i + 1}: profiel op aanvraag`); continue; }
    if (surC == null) { complete = false; reasons.push(`Leuning ${i + 1}: kleur op aanvraag`); continue; }
    const m = r.lengthMm / 1000;
    const amount = m * (P.perMeter + surP + surC);
    lines.push({ label: `Leuning ${i + 1}: ${m.toFixed(2)} m × € ${P.perMeter + surP + surC}`, amount });
    total += amount;
  }

  // Delivery / montage
  if (withDelivery) {
    const d = P.delivery[s.delivery];
    if (!d) { complete = false; reasons.push('Leverwijze onbekend'); }
    else {
      if (d.base) { lines.push({ label: 'Levering, vast', amount: d.base }); total += d.base; }
      if (d.perRail) { const a = d.perRail * s.rails.length; lines.push({ label: `Montage: ${s.rails.length} × € ${d.perRail}`, amount: a }); total += a; }
      if (d.perKm) {
        if (s.km == null) { complete = false; reasons.push('Afstand onbekend (postcode)'); }
        else { const km = s.km * (P.retour ? 2 : 1); const a = km * d.perKm; lines.push({ label: `Reiskosten: ca. ${km} km × € ${d.perKm}`, amount: a }); total += a; }
      }
    }
  }

  return { status: complete ? 'indicatie' : 'aanvraag', total: Math.round(total), lines, reasons, inclBtw: P.inclBtw };
}

export const euro = n => '€ ' + Math.round(n).toLocaleString('nl-NL');
