//
// Created by bytedance on 2022/2/20.
//

/*
Bullet Continuous Collision Detection and Physics Library
Copyright (c) 2003-2007 Erwin Coumans  http://continuousphysics.com/Bullet/

This software is provided 'as-is', without any express or implied warranty.
In no event will the authors be held liable for any damages arising from the use
of this software. Permission is granted to anyone to use this software for any
purpose, including commercial applications, and to alter it and redistribute it
freely, subject to the following restrictions:

1. The origin of this software must not be misrepresented; you must not claim
   that you wrote the original software. If you use this software in a product, an
   acknowledgment in the product documentation would be appreciated but is not
   required.
2. Altered source versions must be plainly marked as such, and must not be
   misrepresented as being the original software.
3. This notice may not be removed or altered from any source distribution.
*/

///-----includes_start-----
#include <stdio.h>

#include "btBulletDynamicsCommon.h"

/// This is a Hello World program for running a basic Bullet physics simulation

int main(int argc, char **argv)
{
	int i;

	btDefaultCollisionConfiguration *collisionConfiguration = new btDefaultCollisionConfiguration();
	btCollisionDispatcher *dispatcher = new btCollisionDispatcher(collisionConfiguration);
	btBroadphaseInterface *overlappingPairCache = new btDbvtBroadphase();
	btSequentialImpulseConstraintSolver *solver = new btSequentialImpulseConstraintSolver;
	btDiscreteDynamicsWorld *dynamicsWorld = new btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfiguration);
	dynamicsWorld->setGravity(btVector3(0, -10, 0));

	btCollisionShape *groundShape = new btBoxShape(btVector3(btScalar(50.), btScalar(50.), btScalar(50.)));
	btAlignedObjectArray<btCollisionShape *> collisionShapes;
	collisionShapes.push_back(groundShape);
	btTransform groundTransform;

	groundTransform.setIdentity();
	groundTransform.setOrigin(btVector3(0, -56, 0));

	{
		btScalar mass(0.);
		bool isDynamic = (mass != 0.f);
		btVector3 localInertia(0, 0, 0);

		if (isDynamic)
			groundShape->calculateLocalInertia(mass, localInertia);

		//using motionstate is recommended, it provides interpolation capabilities, and only synchronizes 'active' objects
		btDefaultMotionState *myMotionState = new btDefaultMotionState(groundTransform);
		btRigidBody::btRigidBodyConstructionInfo rbInfo(mass, myMotionState, groundShape, localInertia);
		btRigidBody *body = new btRigidBody(rbInfo);

		//add the body to the dynamics world
		dynamicsWorld->addRigidBody(body);
	}

	{
		//create a dynamic rigidbody
		btCollisionShape *colShape = new btSphereShape(btScalar(1.));
		collisionShapes.push_back(colShape);

		/// Create Dynamic Objects
		btTransform startTransform;
		startTransform.setIdentity();

		btScalar mass(1.f);
		//rigidbody is dynamic if and only if mass is non zero, otherwise static
		bool isDynamic = (mass != 0.f);
		btVector3 localInertia(0, 0, 0);

		if (isDynamic)
			colShape->calculateLocalInertia(mass, localInertia);

		startTransform.setOrigin(btVector3(2, 10, 0));

		//using motionstate is recommended, it provides interpolation capabilities, and only synchronizes 'active' objects
		btDefaultMotionState *myMotionState = new btDefaultMotionState(startTransform);
		btRigidBody::btRigidBodyConstructionInfo rbInfo(mass, myMotionState, colShape, localInertia);
		btRigidBody *body = new btRigidBody(rbInfo);

		dynamicsWorld->addRigidBody(body);
	}

	/// Do some simulation

	///-----stepsimulation_start-----
	for (i = 0; i < 150; i++)
	{
		dynamicsWorld->stepSimulation(1.f / 60.f, 10);

		//print positions of all objects
		for (int j = dynamicsWorld->getNumCollisionObjects() - 1; j >= 0; j--)
		{
			btCollisionObject *obj = dynamicsWorld->getCollisionObjectArray()[j];
			btRigidBody *body = btRigidBody::upcast(obj);
			if (body && body->getMotionState())
			{
				btTransform trans;
				body->getMotionState()->getWorldTransform(trans);
				printf("world pos = %.2f,%.2f,%.2f\n",
					   float(trans.getOrigin().getX()),
					   float(trans.getOrigin().getY()),
					   float(trans.getOrigin().getZ()));  // XXX Emscripten
			}
		}
	}

	///-----stepsimulation_end-----

	//cleanup in the reverse order of creation/initialization

	///-----cleanup_start-----

	//remove the rigidbodies from the dynamics world and delete them
	for (i = dynamicsWorld->getNumCollisionObjects() - 1; i >= 0; i--)
	{
		btCollisionObject *obj = dynamicsWorld->getCollisionObjectArray()[i];
		btRigidBody *body = btRigidBody::upcast(obj);
		if (body && body->getMotionState())
		{
			delete body->getMotionState();
		}
		dynamicsWorld->removeCollisionObject(obj);
		delete obj;
	}

	//delete collision shapes
	for (int j = 0; j < collisionShapes.size(); j++)
	{
		btCollisionShape *shape = collisionShapes[j];
		collisionShapes[j] = 0;
		delete shape;
	}

	delete dynamicsWorld;
	delete solver;
	delete overlappingPairCache;
	delete dispatcher;
	delete collisionConfiguration;

	//next line is optional: it will be cleared by the destructor when the array goes out of scope
	collisionShapes.clear();

	///-----cleanup_end-----
}