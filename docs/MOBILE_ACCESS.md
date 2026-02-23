# Mobile access (same Wi‑Fi)

If your phone shows **"The URL can't be shown"** or the page never loads, use this checklist.

## 1. Use the correct URL on your phone

When you run `npm run dev`, the terminal may show **Network: http://0.0.0.0:3001**. **Do not open that on your phone** — `0.0.0.0` is not a real address; it just means “listen on all interfaces.”

Use your **Mac’s actual IP address** instead:

- On your Mac, in Terminal, run:
  ```bash
  ipconfig getifaddr en0
  ```
  (Use `en0` for Wi‑Fi; if nothing prints, try `en1` or run `ifconfig | grep "inet "` and use the 192.168.x.x or 10.x.x.x address.)
- On your phone’s browser, open: **`http://YOUR_MAC_IP:3001`**  
  Example: if the command printed `192.168.1.16`, open `http://192.168.1.16:3001`.

Also:
- **Don’t:** Use `localhost` or `127.0.0.1` on the phone (that points to the phone, not your Mac)
- **Don’t:** Use `https://` — dev server is HTTP only

## 2. Same Wi‑Fi

- Phone and Mac must be on the **same Wi‑Fi network** (not cellular, not guest network).
- If your Mac’s IP changed (e.g. after reconnecting), run `ipconfig getifaddr en0` again and use the new IP.

## 3. macOS firewall

If the URL is correct and the phone still can’t connect, the Mac firewall may be blocking Node:

1. **System Settings → Network → Firewall** (or **Security & Privacy → Firewall** on older macOS).
2. If Firewall is **On**, click **Options** and either:
   - **Allow incoming connections** for **Node** or **Terminal** (whichever runs `npm run dev`), or
   - Temporarily turn the firewall **Off** to test, then turn it back on and add the allow rule.

## 4. Restart dev server after changes

After changing `.env.local` or the dev script:

1. Stop the server (Ctrl+C).
2. Run `npm run dev` again.
3. Use `http://YOUR_MAC_IP:3001` on your phone (get the IP with `ipconfig getifaddr en0` if needed).

## 5. Check from your Mac first

On your Mac (in Terminal), run (replace with the IP from `npm run dev`):

```bash
curl -I http://192.168.1.16:3001
```

You should see `HTTP/1.1 200` or `307`. If that works but the phone still can’t open the URL, the issue is usually firewall or a different network.
