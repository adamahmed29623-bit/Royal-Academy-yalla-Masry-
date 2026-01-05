<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>متحف يلا مصري - الإصدار الملكي</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap" rel="stylesheet">
    <style>
        body { margin: 0; overflow: hidden; font-family: 'Cairo', sans-serif; background: #000; color: white; }
        canvas { display: block; }
        
        /* واجهة الدخول */
        #entry-overlay {
            position: fixed; inset: 0; background: radial-gradient(circle, #001d3d 0%, #000 100%);
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            z-index: 100; transition: opacity 0.8s ease;
        }

        #ui-layer { position: absolute; inset: 0; pointer-events: none; z-index: 50; display: none; }
        .interactive { pointer-events: auto; }

        /* لوحة المعلومات */
        #info-panel {
            position: absolute; bottom: 10%; right: 5%; width: 350px;
            background: rgba(0, 8, 20, 0.9); border: 2px solid #f59e0b;
            border-radius: 20px; padding: 25px; transform: translateX(120%);
            transition: transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        #info-panel.active { transform: translateX(0); }

        /* أزرار الحركة للشاشة */
        #controls-hint {
            position: absolute; bottom: 20px; left: 20px;
            background: rgba(245, 158, 11, 0.1); border: 1px solid #f59e0b;
            padding: 10px 20px; border-radius: 15px; font-size: 0.8rem;
        }

        .gold-btn {
            background: linear-gradient(45deg, #f59e0b, #d97706);
            color: black; font-weight: 900; padding: 15px 40px;
            border-radius: 50px; cursor: pointer; transition: 0.3s;
            box-shadow: 0 0 20px rgba(245, 158, 11, 0.4);
        }
        .gold-btn:hover { transform: scale(1.05); box-shadow: 0 0 30px rgba(245, 158, 11, 0.6); }
    </style>
</head>
<body>

    <!-- شاشة البداية الملكية -->
    <div id="entry-overlay">
        <div class="text-center p-6">
            <h1 class="text-5xl font-black text-amber-500 mb-4">أكاديمية يلا مصري</h1>
            <p class="text-amber-200/70 mb-8 text-xl">بانتظار إشارة الدخول من الملكة نفرتيتي...</p>
            <button class="gold-btn text-2xl" onclick="startExperience()">دخول القاعة الملكية</button>
        </div>
    </div>

    <!-- واجهة المستخدم بعد الدخول -->
    <div id="ui-layer">
        <div class="p-6 flex justify-between items-center w-full">
            <div class="flex items-center gap-4">
                <div class="bg-amber-500 p-2 rounded-lg"><img src="https://img.icons8.com/ios-filled/50/000000/museum.png" width="30"/></div>
                <span class="text-2xl font-black italic tracking-tighter">ROYAL MUSEUM</span>
            </div>
            <div id="speaker-icon" class="hidden animate-pulse flex items-center gap-2 text-amber-500">
                <span>المرشد الملكي يتحدث...</span>
                <div class="flex gap-1">
                    <div class="w-1 h-4 bg-amber-500"></div>
                    <div class="w-1 h-6 bg-amber-500"></div>
                    <div class="w-1 h-3 bg-amber-500"></div>
                </div>
            </div>
        </div>

        <div id="info-panel" class="interactive">
            <h2 id="item-title" class="text-amber-500 text-2xl font-black mb-2"></h2>
            <p id="item-desc" class="text-slate-300 text-lg leading-relaxed mb-4"></p>
        </div>

        <div id="controls-hint">
            تحرك: WASD أو الأسهم | تدوير: الماوس
        </div>
    </div>

    <script>
        let scene, camera, renderer, clock;
        let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
        let velocity = new THREE.Vector3();
        let direction = new THREE.Vector3();
        let isStarted = false;
        const apiKey = ""; 

        const artifacts = [
            { id: 1, title: "تمثال الخلود", desc: "أهلاً بكِ يا ملكة القلوب، نفرتيتي. هذا التمثال يرمز إلى هويتنا المصرية التي لا تموت، تماماً كأكاديميتكِ.", x: -6, z: -8, color: 0xffd700 },
            { id: 2, title: "مخطوطة الفصاحة", desc: "هنا دُوّنت أولى كلمات 'يلا مصري'. كل حرف هنا يمثل خطوة نحو الرقي والجمال في الحديث.", x: 6, z: -8, color: 0x00f2ff },
            { id: 3, title: "تاج الملكة", desc: "هذا التاج ليس للزينة، بل هو رمز للعلم والأدب الذي تتوجين به طالباتكِ في كل محفل.", x: 0, z: -14, color: 0xff007f }
        ];

        function startExperience() {
            isStarted = true;
            document.getElementById('entry-overlay').style.opacity = '0';
            setTimeout(() => {
                document.getElementById('entry-overlay').style.display = 'none';
                document.getElementById('ui-layer').style.display = 'block';
            }, 800);
            
            speak("مرحباً بكِ في بيتكِ الملكي، يا جلالة الملكة نفرتيتي.");
        }

        function init() {
            scene = new THREE.Scene();
            scene.background = new THREE.Color(0x000205);
            scene.fog = new THREE.Fog(0x000205, 2, 25);

            camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
            camera.position.set(0, 1.7, 5);

            renderer = new THREE.WebGLRenderer({ antialias: true });
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setPixelRatio(window.devicePixelRatio);
            document.body.appendChild(renderer.domElement);

            clock = new THREE.Clock();

            scene.add(new THREE.AmbientLight(0xffffff, 0.3));
            const spot = new THREE.SpotLight(0xf59e0b, 1);
            spot.position.set(0, 10, 5);
            scene.add(spot);

            const floor = new THREE.Mesh(
                new THREE.PlaneGeometry(50, 50),
                new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.1, metalness: 0.5 })
            );
            floor.rotation.x = -Math.PI / 2;
            scene.add(floor);

            artifacts.forEach(data => {
                const group = new THREE.Group();
                group.position.set(data.x, 0, data.z);

                const base = new THREE.Mesh(
                    new THREE.BoxGeometry(1.2, 1, 1.2),
                    new THREE.MeshStandardMaterial({ color: 0x111111 })
                );
                base.position.y = 0.5;
                group.add(base);

                const art = new THREE.Mesh(
                    new THREE.IcosahedronGeometry(0.4, 0),
                    new THREE.MeshStandardMaterial({ color: data.color, emissive: data.color, emissiveIntensity: 0.5 })
                );
                art.position.y = 1.6;
                group.add(art);
                data.mesh = art;

                const light = new THREE.PointLight(data.color, 1, 4);
                light.position.y = 2;
                group.add(light);

                scene.add(group);
            });

            window.addEventListener('keydown', (e) => handleKey(e.code, true));
            window.addEventListener('keyup', (e) => handleKey(e.code, false));
            document.addEventListener('mousemove', onMouseMove);
            window.addEventListener('resize', onWindowResize);

            animate();
        }

        let yaw = 0, pitch = 0;
        function onMouseMove(e) {
            if (!isStarted) return;
            const sensitivity = 0.002;
            yaw -= e.movementX * sensitivity;
            pitch -= e.movementY * sensitivity;
            pitch = Math.max(-Math.PI/2.5, Math.min(Math.PI/2.5, pitch));
            camera.rotation.order = "YXZ";
            camera.rotation.set(pitch, yaw, 0);
        }

        function handleKey(code, isDown) {
            switch(code) {
                case 'KeyW': case 'ArrowUp': moveForward = isDown; break;
                case 'KeyS': case 'ArrowDown': moveBackward = isDown; break;
                case 'KeyA': case 'ArrowLeft': moveLeft = isDown; break;
                case 'KeyD': case 'ArrowRight': moveRight = isDown; break;
            }
        }

        async function speak(text) {
            const icon = document.getElementById('speaker-icon');
            icon.classList.remove('hidden');
            
            try {
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: `Say with a very elegant, royal, and warm Egyptian-inspired female voice: ${text}` }] }],
                        generationConfig: {
                            responseModalities: ["AUDIO"],
                            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } } }
                        }
                    })
                });
                
                if (!response.ok) throw new Error("TTS API Error");

                const data = await response.json();
                const audioData = data.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
                
                if (!audioData) throw new Error("No audio data received");

                const audioBlob = pcmToWav(audioData, 24000);
                const audioUrl = URL.createObjectURL(audioBlob);
                const audio = new Audio();
                
                // التأكد من تحميل المصدر قبل التشغيل لتجنب خطأ NotSupportedError
                audio.src = audioUrl;
                audio.oncanplaythrough = () => {
                    audio.play().catch(e => console.error("Playback failed:", e));
                };
                
                audio.onended = () => {
                    icon.classList.add('hidden');
                    URL.revokeObjectURL(audioUrl); // تنظيف الذاكرة
                };
                
                audio.onerror = (e) => {
                    console.error("Audio Load Error:", e);
                    icon.classList.add('hidden');
                };

            } catch (e) { 
                console.error("Speak process failed:", e);
                icon.classList.add('hidden');
            }
        }

        function pcmToWav(base64, sampleRate) {
            const buffer = Uint8Array.from(atob(base64), c => c.charCodeAt(0)).buffer;
            const wavHeader = new ArrayBuffer(44);
            const view = new DataView(wavHeader);
            
            // RIFF chunk descriptor
            view.setUint32(0, 0x52494646, false); // "RIFF"
            view.setUint32(4, 36 + buffer.byteLength, true);
            view.setUint32(8, 0x57415645, false); // "WAVE"
            
            // fmt sub-chunk
            view.setUint32(12, 0x666d7420, false); // "fmt "
            view.setUint32(16, 16, true); // Subchunk1Size
            view.setUint16(20, 1, true); // AudioFormat (PCM = 1)
            view.setUint16(22, 1, true); // NumChannels (Mono)
            view.setUint32(24, sampleRate, true);
            view.setUint32(28, sampleRate * 2, true); // ByteRate
            view.setUint16(32, 2, true); // BlockAlign
            view.setUint16(34, 16, true); // BitsPerSample
            
            // data sub-chunk
            view.setUint32(36, 0x64617461, false); // "data"
            view.setUint32(40, buffer.byteLength, true);
            
            const combined = new Uint8Array(wavHeader.byteLength + buffer.byteLength);
            combined.set(new Uint8Array(wavHeader), 0);
            combined.set(new Uint8Array(buffer), wavHeader.byteLength);
            
            return new Blob([combined], { type: 'audio/wav' });
        }

        let currentArtifact = null;

        function update() {
            if (!isStarted) return;
            const delta = clock.getDelta();
            const moveSpeed = 4;

            velocity.x -= velocity.x * 10.0 * delta;
            velocity.z -= velocity.z * 10.0 * delta;

            const camDir = new THREE.Vector3();
            camera.getWorldDirection(camDir);
            camDir.y = 0; camDir.normalize();
            const camSide = new THREE.Vector3().crossVectors(camera.up, camDir).normalize();

            if (moveForward) velocity.addScaledVector(camDir, moveSpeed * delta);
            if (moveBackward) velocity.addScaledVector(camDir, -moveSpeed * delta);
            if (moveLeft) velocity.addScaledVector(camSide, moveSpeed * delta);
            if (moveRight) velocity.addScaledVector(camSide, -moveSpeed * delta);

            camera.position.add(velocity);

            let found = null;
            artifacts.forEach(art => {
                art.mesh.rotation.y += 0.02;
                const d = camera.position.distanceTo(new THREE.Vector3(art.x, 1.7, art.z));
                if (d < 3) found = art;
            });

            const panel = document.getElementById('info-panel');
            if (found && currentArtifact !== found) {
                currentArtifact = found;
                document.getElementById('item-title').innerText = found.title;
                document.getElementById('item-desc').innerText = found.desc;
                panel.classList.add('active');
                speak(found.desc);
            } else if (!found && currentArtifact) {
                currentArtifact = null;
                panel.classList.remove('active');
            }
        }

        function onWindowResize() {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        }

        function animate() {
            requestAnimationFrame(animate);
            update();
            renderer.render(scene, camera);
        }

        init();
    </script>
</body>
</html>
