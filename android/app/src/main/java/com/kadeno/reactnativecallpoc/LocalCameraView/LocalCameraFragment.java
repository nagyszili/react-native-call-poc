package com.kadeno.reactnativecallpoc.LocalCameraView;

import android.os.Bundle;

import androidx.fragment.app.Fragment;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import com.kadeno.reactnativecallpoc.R;


public class LocalCameraFragment extends Fragment {


    private LocalCameraView localCameraView;

    public LocalCameraFragment() {
        // Required empty public constructor
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

    }

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {

        super.onCreateView(inflater, container, savedInstanceState);
        localCameraView = new LocalCameraView(this.getContext());
        return localCameraView; // this CustomView could be any view that you want to render
    }


}