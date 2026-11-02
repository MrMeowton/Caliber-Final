# runtime — Shift Handover Summary

```
Summarise the shift logs and alerts below into a handover for the incoming shift at {{nama_unit}}.
Format (English, max 120 words):
1. Safety-critical items (first)
2. Open equipment issues with asset ID, current value vs limit, and trend
3. Pending actions and owner
4. Items that need escalation but were not escalated
Cite each item as [log date/shift] or [sensor asset_id timestamp].
<logs>{{log_shift}}</logs>
<alerts>{{alert_aktif}}</alerts>
```

Fallback demo: [ISI]
