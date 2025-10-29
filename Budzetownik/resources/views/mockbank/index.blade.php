<!doctype html>
<html lang="pl">
<head>
  <meta charset="utf-8">
  <title>MockBank → Ostatnie transakcje</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu;max-width:960px;margin:24px auto;padding:0 12px}
    table{width:100%;border-collapse:collapse} th,td{padding:8px;border-bottom:1px solid #eee;text-align:left}
    .pos{color:#2e7d32}.neg{color:#c62828}
    .cards{display:flex;gap:16px;margin:16px 0}
    .card{padding:12px;border:1px solid #ddd;border-radius:8px}
  </style>
</head>
<body>
  <h1>MockBank → Ostatnie transakcje</h1>

  @php
    $fmt = fn($minor) => number_format(($minor ?? 0) / 100, 2, ',', ' ');
  @endphp

  <div class="cards">
    <div class="card">
      <div>Wpływy</div>
      <strong>{{ $fmt($sumIn ?? 0) }} zł</strong>
    </div>
    <div class="card">
      <div>Wydatki</div>
      <strong>{{ $fmt($sumOut ?? 0) }} zł</strong>
    </div>
    <div class="card">
      <div>Liczba pozycji</div>
      <strong>{{ isset($txns) ? $txns->count() : 0 }}</strong>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Data</th>
        <th>Opis</th>
        <th>Kwota</th>
        <th>Waluta</th>
        <th>External ID</th>
      </tr>
    </thead>
    <tbody>
    @forelse($txns ?? [] as $t)
      @php $minor = $t->amount_minor ?? 0; @endphp
      <tr>
        <td>{{ \Illuminate\Support\Carbon::parse($t->date)->format('Y-m-d H:i') }}</td>
        <td>{{ $t->description }}</td>
        <td class="{{ $minor < 0 ? 'neg' : 'pos' }}">{{ $fmt($minor) }} zł</td>
        <td>{{ $t->currency ?? 'PLN' }}</td>
        <td>{{ $t->external_id }}</td>
      </tr>
    @empty
      <tr><td colspan="5">Brak danych — wyślij event webhook lub zrób import.</td></tr>
    @endforelse
    </tbody>
  </table>
</body>
</html>
