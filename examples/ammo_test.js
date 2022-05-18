import {Ammo as globalAmmo} from '../builds/ammo.js'

function AmmoTest() {
  return globalAmmo().then(function (globalAmmo) {
    function main() {
      var NUM = 0, NUMRANGE = [];

      var collisionConfiguration = new globalAmmo.btDefaultCollisionConfiguration();
      var dispatcher = new globalAmmo.btCollisionDispatcher(collisionConfiguration);
      var overlappingPairCache = new globalAmmo.btDbvtBroadphase();
      var solver = new globalAmmo.btSequentialImpulseConstraintSolver();
      var dynamicsWorld = new globalAmmo.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfiguration);
      dynamicsWorld.setGravity(new globalAmmo.btVector3(0, -10, 0));

      var groundShape = new globalAmmo.btBoxShape(new globalAmmo.btVector3(50, 50, 50));
      var bodies = [];
      var groundTransform = new globalAmmo.btTransform();

      groundTransform.setIdentity();
      groundTransform.setOrigin(new globalAmmo.btVector3(0, -56, 0));

      (function () {
        var mass = 0;
        var localInertia = new globalAmmo.btVector3(0, 0, 0);
        var myMotionState = new globalAmmo.btDefaultMotionState(groundTransform);
        var rbInfo = new globalAmmo.btRigidBodyConstructionInfo(0, myMotionState, groundShape, localInertia);
        var body = new globalAmmo.btRigidBody(rbInfo);

        dynamicsWorld.addRigidBody(body);
        bodies.push(body);
      })();

      var boxShape = new globalAmmo.btBoxShape(new globalAmmo.btVector3(1, 1, 1));

      function resetPositions() {
        var side = Math.ceil(Math.pow(NUM, 1 / 3));
        var i = 1;
        for (var x = 0; x < side; x++) {
          for (var y = 0; y < side; y++) {
            for (var z = 0; z < side; z++) {
              if (i == bodies.length) break;
              var body = bodies[i++];
              var origin = body.getWorldTransform().getOrigin();
              origin.setX((x - side / 2) * (2.2 + Math.random()));
              origin.setY(y * (3 + Math.random()));
              origin.setZ((z - side / 2) * (2.2 + Math.random()) - side - 3);
              body.activate();
              var rotation = body.getWorldTransform().getRotation();
              rotation.setX(1);
              rotation.setY(0);
              rotation.setZ(0);
              rotation.setW(1);
            }
          }
        }
      }

      function startUp() {
        NUMRANGE.forEach(function (i) {
          var startTransform = new globalAmmo.btTransform();
          startTransform.setIdentity();
          var mass = 1;
          var localInertia = new globalAmmo.btVector3(0, 0, 0);
          boxShape.calculateLocalInertia(mass, localInertia);

          var myMotionState = new globalAmmo.btDefaultMotionState(startTransform);
          var rbInfo = new globalAmmo.btRigidBodyConstructionInfo(mass, myMotionState, boxShape, localInertia);
          var body = new globalAmmo.btRigidBody(rbInfo);

          dynamicsWorld.addRigidBody(body);
          bodies.push(body);
        });

        resetPositions();
      }

      var transform = new globalAmmo.btTransform();

      function readBulletObject(i, object) {
        var body = bodies[i];
        body.getMotionState().getWorldTransform(transform);
        var origin = transform.getOrigin();
        object[0] = origin.x();
        object[1] = origin.y();
        object[2] = origin.z();
        var rotation = transform.getRotation();
        object[3] = rotation.x();
        object[4] = rotation.y();
        object[5] = rotation.z();
        object[6] = rotation.w();
      }

      var nextTimeToRestart = 0;

      function timeToRestart() {
        if (nextTimeToRestart) {
          if (Date.now() >= nextTimeToRestart) {
            nextTimeToRestart = 0;
            return true;
          }
          return false;
        }
        for (var i = 1; i <= NUM; i++) {
          var body = bodies[i];
          if (!body.isActive()) {
            nextTimeToRestart = Date.now() + 1000;
            break;
          }
        }
        return false;
      }

      var meanDt = 0, meanDt2 = 0, frame = 1;

      function simulate(dt) {
        dt = dt || 1;

        dynamicsWorld.stepSimulation(dt, 2);

        var alpha;
        if (meanDt > 0) {
          alpha = Math.min(0.1, dt / 1000);
        } else {
          alpha = 0.1;
        }
        meanDt = alpha * dt + (1 - alpha) * meanDt;

        var alpha2 = 1 / frame++;
        meanDt2 = alpha2 * dt + (1 - alpha2) * meanDt2;

        var data = {objects: [], currFPS: Math.round(1000 / meanDt), allFPS: Math.round(1000 / meanDt2)};

        for (var i = 0; i < NUM; i++) {
          var object = [];
          readBulletObject(i + 1, object);
          data.objects[i] = object;
        }

        var xyz = [];
        for (var tt = 0; tt < 10; ++tt) {
          var ta = data.objects[tt];
          xyz.push([ta[3], ta[4], ta[5], ta[6]]);
        }
        console.log(JSON.stringify(xyz));

        if (timeToRestart()) resetPositions();
      }

      var interval = null;

      var do_test = function (event) {
        NUM = event.data;
        NUMRANGE.length = 0;
        while (NUMRANGE.length < NUM) NUMRANGE.push(NUMRANGE.length + 1);

        frame = 1;
        meanDt = meanDt2 = 0;

        startUp();

        var last = Date.now();

        function mainLoop() {
          var now = Date.now();
          simulate(now - last + 1);
          last = now;
        }

        mainLoop();
      };

      do_test({data: 500});
    }

    main();
  });
}

AmmoTest();